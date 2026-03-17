export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.VITE_ANTHROPIC_KEY;
  if (!key) return res.status(500).json({ error: "VITE_ANTHROPIC_KEY not configured" });

  const { prompt, maxTokens = 300, temperature = 0.3 } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "API error" });

    const text = data.content?.[0]?.text || null;
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
