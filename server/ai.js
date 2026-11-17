// Turns a meeting transcript into a draft of projects + tasks using Claude.
const SYSTEM = `You convert meeting transcripts into structured project plans for NovaWorks Technologies.
Return ONLY one JSON object, no prose and no markdown fences, in exactly this shape:
{"projects":[{"name":"","clientName":"","description":"","managerId":"","deadline":"YYYY-MM-DD","tasks":[{"title":"","description":"","assigneeId":"","deadline":"YYYY-MM-DD","estimatedHours":0}]}]}

Rules:
- Use ONLY the user ids from the provided directory for managerId and assigneeId. Never invent people. People who are not in the directory (e.g. client contacts) must not be assigned anything.
- managerId must be a MANAGER; assigneeId must be an AGENT.
- Follow the FINAL agreed decisions. If a date, estimate, owner or deadline was changed later in the meeting, use the latest value and ignore the earlier one. A final recap, if present, is authoritative.
- Ignore rejected or excluded features (e.g. things explicitly said to be out of scope or future work). Do not create tasks for them.
- Keep separate projects separate and separate tasks separate, even when the same person owns several.
- Deadlines are in the year 2026 unless stated otherwise. Dates are YYYY-MM-DD. Interpret "12 October" as 2026-10-12.
- estimatedHours is a number of effort hours for that task as agreed, not a number of days.
- Write a short, clear description for each project and task that states the agreed scope, including relevant exclusions.
- If a required value truly cannot be determined from the transcript, use null for it rather than guessing.`

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI did not return JSON.')
  return JSON.parse(cleaned.slice(start, end + 1))
}

export async function draftFromTranscript(transcript, users) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured on the server.')
  // Directory sent to the AI: never includes emails or passwords/hashes.
  const directory = users.map((u) => ({ id: u.id, name: u.name, role: u.role, skills: u.skills }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 8000,
      temperature: 0,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `TEAM DIRECTORY:\n${JSON.stringify(directory, null, 2)}\n\nMEETING TRANSCRIPT:\n${transcript}`,
        },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`AI request failed (${res.status}). ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  return extractJson(text)
}
