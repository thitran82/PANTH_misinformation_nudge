export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const { claim } = req.body;
  if (!claim || typeof claim !== 'string' || claim.trim().length < 5) {
    return res.status(400).json({ error: 'A claim string is required.' });
  }
 
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }
 
  const SYSTEM = `You are PANTH — the Platform for Automated Nudging of Truth and Harm.
You evaluate health-related claims and misinformation for a research platform studying vaccine misinformation sharing hesitancy.
 
For any claim provided, return ONLY a valid JSON object with this exact structure:
{
  "truth_score": <number 0-10, where 0=completely false, 10=completely true>,
  "harm_score": <number 0-10, overall harm potential if widely shared>,
  "harm_health": <number 0-10, personal health harm>,
  "harm_psychological": <number 0-10, psychological/emotional harm>,
  "harm_community": <number 0-10, community/public health harm>,
  "truth_verdict": "<one sentence: truth status label and brief explanation>",
  "harm_verdict": "<one sentence: harm level label and brief explanation>",
  "reasoning": "<2-3 sentences explaining the scores, grounded in public health evidence>"
}
 
Return ONLY the JSON object. No preamble, no markdown fences, no text outside the JSON.`;
 
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Evaluate this claim:\n\n"${claim.trim()}"` }]
      })
    });
 
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Anthropic API error' });
    }
 
    const data = await response.json();
    const raw = data.content[0].text.trim()
      .replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
 
    const result = JSON.parse(raw);
    return res.status(200).json(result);
 
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
