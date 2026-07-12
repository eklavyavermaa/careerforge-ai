const MAX_RESUME_CHARS = 12000;
const MAX_JD_CHARS = 6000;

/**
 * @param {{ resumeText: string, jobDescription?: string, companyName?: string, roleTitle?: string, tone: string }} params
 */
exports.buildCoverLetterPrompt = ({ resumeText, jobDescription, companyName, roleTitle, tone }) => {
  const targetRoleLine = roleTitle
    ? `Target role: ${roleTitle}.`
    : "Target role: infer the most fitting role from the job description or resume itself.";

  const targetCompanyLine = companyName
    ? `Target company: ${companyName}. Use this name directly in the letter.`
    : 'Target company: not specified — address it generically (e.g. "Dear Hiring Manager") without placeholder brackets.';

  return `You are an expert career writing assistant. Write a compelling, personalized cover letter based on the candidate's resume below.

Return ONLY a single valid JSON object — no markdown, no commentary before or after it — matching EXACTLY this schema:
{ "coverLetter": string }

Guidelines:
- Tone: ${tone}.
- ${targetRoleLine}
- ${targetCompanyLine}
- 3-4 paragraphs, under 400 words total.
- Reference specific, real achievements and skills from the resume text below. Never invent employers, dates, or credentials that are not present in it.
- Never use placeholder brackets like [Company Name] or [Your Name] anywhere in the output.
- Format as plain text with paragraph breaks (use \\n\\n between paragraphs). No markdown headers or bullet points.

${
  jobDescription
    ? `JOB DESCRIPTION:\n"""\n${String(jobDescription).slice(0, MAX_JD_CHARS)}\n"""`
    : 'No job description was provided — write a strong, general-purpose cover letter based on the resume alone.'
}

RESUME TEXT:
"""
${String(resumeText).slice(0, MAX_RESUME_CHARS)}
"""`;
};
