// Validates the shape of the JSON Gemini returns before it's persisted, so a
// malformed/partial AI response never silently corrupts a ResumeAnalysis document.

const REQUIRED_FIELDS = [
  'atsScore',
  'resumeScore',
  'summary',
  'strengths',
  'weaknesses',
  'extractedSkills',
  'missingSkills',
  'keywordAnalysis',
  'grammarIssues',
  'improvementSuggestions',
  'industryReadinessScore',
];

const REQUIRED_ARRAY_FIELDS = [
  'strengths',
  'weaknesses',
  'extractedSkills',
  'missingSkills',
  'keywordAnalysis',
  'grammarIssues',
  'improvementSuggestions',
];

const clampScore = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(Math.max(Math.round(num), 0), 100);
};

exports.validateResumeAnalysis = (parsed) => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, reason: 'AI response was not a JSON object.' };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in parsed)) {
      return { valid: false, reason: `AI response is missing required field "${field}".` };
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(parsed[field])) {
      return { valid: false, reason: `AI response field "${field}" must be an array.` };
    }
  }

  if (typeof parsed.summary !== 'string') {
    return { valid: false, reason: 'AI response field "summary" must be a string.' };
  }

  return { valid: true };
};

// Normalizes numeric scores and trims text arrays so what we store is always
// well-formed even if the model returns slightly-off types (e.g. "85" instead of 85).
exports.normalizeResumeAnalysis = (parsed, { hasJobDescription }) => ({
  atsScore: clampScore(parsed.atsScore),
  resumeScore: clampScore(parsed.resumeScore),
  matchPercentage: hasJobDescription ? clampScore(parsed.matchPercentage) : null,
  summary: String(parsed.summary).trim(),
  strengths: parsed.strengths.map((s) => String(s).trim()).filter(Boolean),
  weaknesses: parsed.weaknesses.map((s) => String(s).trim()).filter(Boolean),
  extractedSkills: parsed.extractedSkills.map((s) => String(s).trim()).filter(Boolean),
  missingSkills: parsed.missingSkills.map((s) => String(s).trim()).filter(Boolean),
  keywordAnalysis: parsed.keywordAnalysis
    .filter((k) => k && typeof k === 'object')
    .map((k) => ({
      keyword: String(k.keyword || '').trim(),
      present: Boolean(k.present),
      importance: ['high', 'medium', 'low'].includes(k.importance) ? k.importance : 'medium',
    }))
    .filter((k) => k.keyword),
  grammarIssues: parsed.grammarIssues
    .filter((g) => g && typeof g === 'object')
    .map((g) => ({
      issue: String(g.issue || '').trim(),
      suggestion: String(g.suggestion || '').trim(),
      location: String(g.location || '').trim(),
    }))
    .filter((g) => g.issue),
  improvementSuggestions: parsed.improvementSuggestions.map((s) => String(s).trim()).filter(Boolean),
  industryReadinessScore: clampScore(parsed.industryReadinessScore),
});
