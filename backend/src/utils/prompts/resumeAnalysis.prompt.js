// Builds the prompt sent to Gemini for resume analysis. Kept as a pure
// function (no I/O) so it's trivial to unit test and reuse elsewhere
// (e.g. a future JD-matching or cover-letter module can import it).

const MAX_RESUME_CHARS = 15000;
const MAX_JD_CHARS = 6000;

exports.buildResumeAnalysisPrompt = (resumeText, jobDescription) => {
  const trimmedResume = String(resumeText).slice(0, MAX_RESUME_CHARS);

  const jdSection = jobDescription
    ? `The candidate is targeting the specific job description below. Compare the resume against it and set "matchPercentage" (0-100) to reflect how well the resume matches this job description. Let the missing skills and keyword analysis be driven primarily by what this job description requires.

JOB DESCRIPTION:
"""
${String(jobDescription).slice(0, MAX_JD_CHARS)}
"""`
    : 'No specific job description was provided. Evaluate the resume for general ATS-friendliness and industry readiness for the role(s) implied by the resume itself. Set "matchPercentage" to null.';

  return `You are an expert technical resume reviewer and ATS (Applicant Tracking System) specialist with years of experience helping software engineering and tech candidates improve their resumes.

Analyze the resume text provided below and return ONLY a single valid JSON object — no markdown formatting, no code fences, no commentary before or after it — matching EXACTLY this schema:

{
  "atsScore": number,
  "resumeScore": number,
  "matchPercentage": number or null,
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "extractedSkills": string[],
  "missingSkills": string[],
  "keywordAnalysis": [{ "keyword": string, "present": boolean, "importance": "high" | "medium" | "low" }],
  "grammarIssues": [{ "issue": string, "suggestion": string, "location": string }],
  "improvementSuggestions": string[],
  "industryReadinessScore": number
}

Field guidance:
- "atsScore": 0-100, how well this resume would parse through automated ATS software (formatting, structure, keyword density).
- "resumeScore": 0-100, overall quality of the resume as a document (clarity, impact, achievements vs. duties).
- "summary": 2-4 sentence honest overview of the candidate's profile and experience level.
- "strengths" / "weaknesses": 3-6 concise, specific bullet points each.
- "extractedSkills": every technical and relevant soft skill actually found in the resume text.
- "missingSkills": relevant skills that are absent given the candidate's apparent target role (or the job description, if provided).
- "keywordAnalysis": 8-15 role-relevant keywords with whether each is present in the resume.
- "grammarIssues": genuine grammar, tense-consistency, or clarity issues found in the text; return an empty array if none are found. Do not invent issues.
- "improvementSuggestions": 4-8 specific, actionable suggestions the candidate can act on immediately.
- "industryReadinessScore": 0-100, how ready this candidate looks for the industry/role based solely on resume content.

${jdSection}

Rules:
- Base every judgement strictly on the resume text below. Never invent employers, dates, degrees, or credentials that are not present in the text.
- All numeric scores must be integers between 0 and 100.
- If the resume text is very short, generic, or low quality, reflect that honestly with lower scores rather than inflating them.
- Return ONLY the JSON object described above.

RESUME TEXT:
"""
${trimmedResume}
"""`;
};
