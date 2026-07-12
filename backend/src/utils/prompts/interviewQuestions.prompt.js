const VALID_CATEGORIES = ['hr', 'technical', 'behavioral'];

/**
 * @param {{ targetRole: string, experienceLevel: string, categories: string[], count: number }} params
 */
exports.buildInterviewQuestionsPrompt = ({ targetRole, experienceLevel, categories, count }) => {
  const safeCategories = categories.filter((c) => VALID_CATEGORIES.includes(c));
  const categoryList = (safeCategories.length ? safeCategories : VALID_CATEGORIES).join(', ');

  return `You are an expert technical interviewer. Generate ${count} realistic interview questions for a candidate targeting the role "${targetRole}" at a "${experienceLevel}" experience level.

Return ONLY a valid JSON object — no markdown, no commentary — matching EXACTLY this schema:
{ "questions": [{ "question": string, "category": "hr" | "technical" | "behavioral" }] }

Rules:
- Distribute questions across these requested categories: ${categoryList}.
- Make questions specific to the role and experience level, with progressively varied difficulty.
- Avoid generic filler questions ("tell me about yourself" is fine once, not repeated).
- Return exactly ${count} questions.
- Return ONLY the JSON object described above.`;
};
