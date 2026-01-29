import { GoogleGenerativeAI } from '@google/generative-ai';
import { pedroContext, chatbotInstructions } from '../context/pedro-info.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CORS headers for cross-origin requests from portfolio site
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, replace with your portfolio domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/**
 * Main chat endpoint handler
 * @param {Request} req - Incoming request
 * @param {Response} res - Response object
 */
export default async function handler(req, res) {
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

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Build the conversation context
    const systemPrompt = `${chatbotInstructions}\n\n## Pedro's Information:\n${pedroContext}`;

    // Format conversation history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will answer questions about Pedro Díaz professionally and helpfully, using only the information provided.' }],
        },
        ...history,
      ],
    });

    // Send the message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const responseText = response.text();

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

// Set response headers for all responses
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
