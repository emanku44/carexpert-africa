import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  const { query } = await req.json()
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `Extract car details and return ONLY valid JSON:
{"make":"","model":"","variant":"","year":0,"mileage":null,"engine_cc":null,"fuel_type":"Petrol","transmission":"Automatic","body_type":"SUV","drive_type":"4WD","colour":"","condition":"Used — Good","description":""}
Return ONLY JSON, no other text.`,
      messages: [{ role: 'user', content: `Extract car details from: "${query}"` }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  
  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    return new Response(JSON.stringify(json), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch {
    return new Response(JSON.stringify({ error: 'failed' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
})