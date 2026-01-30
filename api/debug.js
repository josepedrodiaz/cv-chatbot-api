import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Check API key
    const hasKey = !!process.env.GEMINI_API_KEY;
    const keyLength = process.env.GEMINI_API_KEY?.length || 0;

    // Try to initialize SDK
    let sdkError = null;
    let apiResponse = null;

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
      });

      // Try simple request
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: 'Say hello in one word'
      });

      apiResponse = response.text;
    } catch (error) {
      sdkError = {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3)
      };
    }

    return res.status(200).json({
      hasApiKey: hasKey,
      apiKeyLength: keyLength,
      sdkError: sdkError,
      apiResponse: apiResponse,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}
