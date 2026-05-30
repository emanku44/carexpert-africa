export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'No query' })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `Extract car details from a description and return ONLY valid JSON:
{
  "make": string,
  "model": string,
  "variant": string or "",
  "year": number,
  "mileage": number or null,
  "engine_cc": number or null,
  "fuel_type": "Petrol"|"Diesel"|"Hybrid"|"Electric",
  "transmission": "Automatic"|"Manual"|"CVT",
  "body_type": "SUV"|"Sedan"|"Hatchback"|"Pickup"|"Minivan"|"Coupe"|"Wagon"|"Van"|"Truck"|"Other",
  "drive_type": "AWD"|"4WD"|"4x4"|"RWD"|"FWD"|"2WD",
  "colour": string or "",
  "condition": "New"|"Used — Excellent"|"Used — Good"|"Used — Fair"|"Foreign Used — Excellent"|"Foreign Used — Good",
  "description": string (2-3 sentence listing description)
}
Return ONLY the JSON, no other text.`,
      messages: [{ role: 'user', content: `Extract details: "${query}"` }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  
  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    res.json(json)
  } catch {
    res.status(500).json({ error: 'Parse failed', raw: text })
  }
}