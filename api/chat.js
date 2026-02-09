import { GoogleGenAI } from '@google/genai';
import { pedroContext, chatbotInstructions } from '../context/pedro-info.js';

const ALLOWED_ORIGIN = 'https://josepedrodiaz.com';

/**
 * Main chat endpoint handler
 * @param {Request} req - Incoming request
 * @param {Response} res - Response object
 */
export default async function handler(req, res) {
  // Set CORS headers for all responses
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a valid message'
      });
    }

    // Validate message length
    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Please keep your message under 500 characters'
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'API key not configured. Please contact the administrator.'
      });
    }

    // Initialize the AI client
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Build the full prompt with context
    const systemPrompt = `${chatbotInstructions}\n\n## Pedro's Information:\n${pedroContext}`;

    // Build conversation history
    let fullPrompt = systemPrompt + '\n\n';
    if (conversationHistory.length > 0) {
      fullPrompt += '## Previous Conversation:\n';
      conversationHistory.forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    fullPrompt += `\nUser: ${message}\nAssistant:`;

    // Generate response using Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: fullPrompt
    });

    const responseText = response.text;

    // Return the response
    return res.status(200).json({
      success: true,
      response: responseText,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    // Handle specific error types
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'API authentication failed. Please try again later.'
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in a moment.'
      });
    }

    // Generic error response
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    });
  }
}
