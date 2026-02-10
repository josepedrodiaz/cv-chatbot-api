export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ ok: false });
  }

  try {
    // Check API key validity without consuming generation quota
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}&pageSize=1`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(503).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ ok: false });
  }
}
