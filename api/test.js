// Simple test endpoint to verify deployment and env vars
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const hasApiKey = !!process.env.GEMINI_API_KEY;

  return res.status(200).json({
    success: true,
    message: 'API is working',
    hasApiKey: hasApiKey,
    timestamp: new Date().toISOString()
  });
}
