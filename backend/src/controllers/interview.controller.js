const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const InterviewSession = require('../models/InterviewSession.model');
const { generateStructuredJson } = require('../services/gemini.service');
const { buildInterviewQuestionsPrompt } = require('../utils/prompts/interviewQuestions.prompt');
const {
  buildAnswerFeedbackPrompt,
  buildOverallFeedbackPrompt,
} = require('../utils/prompts/interviewFeedback.prompt');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');
const { logEvent } = require('../utils/events');
const { createNotification } = require('../utils/notify');

const VALID_CATEGORIES = ['hr', 'technical', 'behavioral'];
const clampInt = (value, min, max) => Math.min(Math.max(Math.round(Number(value) || 0), min), max);

// @desc    Start a new mock interview session (AI-generated questions)
// @route   POST /api/v1/interviews
exports.startSession = catchAsync(async (req, res, next) => {
  const { targetRole, experienceLevel, categories, count } = req.body;

  const questionCategories = Array.isArray(categories) && categories.length ? categories : VALID_CATEGORIES;
  const questionCount = count ? clampInt(count, 3, 10) : 6;

  const prompt = buildInterviewQuestionsPrompt({
    targetRole,
    experienceLevel: experienceLevel || 'fresher',
    categories: questionCategories,
    count: questionCount,
  });

  const { parsed } = await generateStructuredJson(prompt, { temperature: 0.7 });

  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  const questions = parsed.questions
    .filter((q) => q && q.question)
    .map((q) => ({
      question: String(q.question).trim(),
      category: VALID_CATEGORIES.includes(q.category) ? q.category : 'technical',
    }));

  if (questions.length === 0) {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  const session = await InterviewSession.create({
    user: req.user._id,
    targetRole,
    experienceLevel: experienceLevel || 'fresher',
    questions,
    status: 'in_progress',
  });

  res.status(201).json({
    success: true,
    message: 'Interview session started.',
    data: { session },
  });
});

// @desc    List the user's interview sessions (paginated)
// @route   GET /api/v1/interviews
exports.getUserSessions = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [sessions, total] = await Promise.all([
    InterviewSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    InterviewSession.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { sessions },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get a single interview session by ID
// @route   GET /api/v1/interviews/:id
exports.getSessionById = catchAsync(async (req, res, next) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) return next(new AppError('Interview session not found.', 404));

  res.status(200).json({ success: true, data: { session } });
});

// @desc    Submit an answer to one question and get AI feedback + score
// @route   POST /api/v1/interviews/:id/questions/:questionId/answer
exports.submitAnswer = catchAsync(async (req, res, next) => {
  const { id, questionId } = req.params;
  const { answer } = req.body;

  const session = await InterviewSession.findOne({ _id: id, user: req.user._id });
  if (!session) return next(new AppError('Interview session not found.', 404));
  if (session.status === 'completed') {
    return next(new AppError('This interview session has already been completed.', 400));
  }

  const question = session.questions.id(questionId);
  if (!question) return next(new AppError('Question not found in this session.', 404));

  const prompt = buildAnswerFeedbackPrompt({
    question: question.question,
    category: question.category,
    targetRole: session.targetRole,
    userAnswer: answer,
  });

  const { parsed } = await generateStructuredJson(prompt, { temperature: 0.4 });

  if (!parsed || typeof parsed.feedback !== 'string' || typeof parsed.score !== 'number') {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  question.userAnswer = String(answer).trim();
  question.aiFeedback = parsed.feedback.trim();
  question.score = clampInt(parsed.score, 0, 10);

  await session.save();

  res.status(200).json({
    success: true,
    message: 'Answer submitted and feedback generated.',
    data: { question },
  });
});

// @desc    Complete a session: generate overall score + feedback
// @route   POST /api/v1/interviews/:id/complete
exports.completeSession = catchAsync(async (req, res, next) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) return next(new AppError('Interview session not found.', 404));
  if (session.status === 'completed') {
    return next(new AppError('This interview session has already been completed.', 400));
  }

  const answeredQuestions = session.questions.filter((q) => q.userAnswer && q.userAnswer.trim());
  if (answeredQuestions.length === 0) {
    return next(new AppError('Answer at least one question before completing the session.', 400));
  }

  const prompt = buildOverallFeedbackPrompt({ targetRole: session.targetRole, questions: answeredQuestions });
  const { parsed } = await generateStructuredJson(prompt, { temperature: 0.4 });

  if (!parsed || typeof parsed.overallScore !== 'number' || typeof parsed.overallFeedback !== 'string') {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  session.overallScore = clampInt(parsed.overallScore, 0, 100);
  session.overallFeedback = parsed.overallFeedback.trim();
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();

  logEvent(req.user._id, 'interview_session_completed', {
    sessionId: session._id,
    overallScore: session.overallScore,
  });
  await createNotification({
    user: req.user._id,
    type: 'interview_completed',
    title: 'Interview session completed',
    message: `Your mock interview for "${session.targetRole}" scored ${session.overallScore}/100.`,
    link: `/interviews/${session._id}`,
  });

  res.status(200).json({
    success: true,
    message: 'Interview session completed.',
    data: { session },
  });
});

// @desc    Delete (abandon) an interview session
// @route   DELETE /api/v1/interviews/:id
exports.deleteSession = catchAsync(async (req, res, next) => {
  const session = await InterviewSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!session) return next(new AppError('Interview session not found.', 404));

  res.status(200).json({ success: true, message: 'Interview session deleted.' });
});
