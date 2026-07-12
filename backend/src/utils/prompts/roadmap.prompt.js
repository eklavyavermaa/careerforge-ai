/**
 * @param {{ targetRole: string, missingSkills: string[], extractedSkills: string[] }} params
 */
exports.buildRoadmapPrompt = ({ targetRole, missingSkills, extractedSkills }) => `You are an expert career coach and curriculum designer. Build a personalized learning roadmap for a candidate targeting the role "${targetRole}".

Candidate's current skills: ${extractedSkills.length ? extractedSkills.join(', ') : 'none listed'}.
Skills they are missing for this role: ${missingSkills.length ? missingSkills.join(', ') : 'general upskilling for this role'}.

Return ONLY a valid JSON object — no markdown, no commentary — matching EXACTLY this schema:
{
  "milestones": [
    {
      "title": string,
      "skill": string,
      "items": [{ "title": string, "description": string, "estimatedHours": number }]
    }
  ]
}

Guidelines:
- 3-6 milestones, ordered from foundational to advanced, each targeting one missing skill (or a closely related group).
- Each milestone should have 2-5 concrete, actionable items (a course, project, or practice task) with realistic estimated hours.
- Be specific (e.g. "Build a REST API with Express and MongoDB implementing JWT auth") rather than vague ("Learn backend").
- Do not include resource URLs — focus on clear, actionable item titles and descriptions.
Return ONLY the JSON object described above.`;
