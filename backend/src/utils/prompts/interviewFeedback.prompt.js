const MAX_ANSWER_CHARS = 4000;

/**
 * @param {{ question: string, category: string, targetRole: string, userAnswer: string }} params
 */
exports.buildAnswerFeedbackPrompt = ({ question, category, targetRole, userAnswer }) => `You are an expert interview coach. The candidate is interviewing for the role "${targetRole}".

Question (${category}): "${question}"
Candidate's answer: """${String(userAnswer).slice(0, MAX_ANSWER_CHARS)}"""

Return ONLY a valid JSON object — no markdown, no commentary — matching EXACTLY this schema:
{ "feedback": string, "score": number }

Guidelines:
- "feedback": 2-4 sentences of specific, constructive feedback (what was strong, what to improve).
- "score": integer 0-10 rating the quality of this specific answer.
- Base the feedback strictly on what the candidate actually wrote.
Return ONLY the JSON object.`;

/**
 * @param {{ targetRole: string, questions: Array<{ question: string, category: string, userAnswer: string, score: number }> }} params
 */
exports.buildOverallFeedbackPrompt = ({ targetRole, questions }) => {
  const transcript = questions
    .map(
      (q, i) =>
        `Q${i + 1} (${q.category}, scored ${q.score ?? 'n/a'}/10): ${q.question}\nAnswer: ${String(
          q.userAnswer || ''
        ).slice(0, 1000)}`
    )
    .join('\n\n');

  return `You are an expert interview coach reviewing a completed mock interview for the role "${targetRole}".

${transcript}

Return ONLY a valid JSON object — no markdown, no commentary — matching EXACTLY this schema:
{ "overallScore": number, "overallFeedback": string }

Guidelines:
- "overallScore": integer 0-100 reflecting overall performance across all answered questions.
- "overallFeedback": 3-5 sentences covering strengths, key weaknesses, and concrete next steps.
Return ONLY the JSON object.`;
};
