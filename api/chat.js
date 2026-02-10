import { GoogleGenAI, Type, FunctionCallingConfigMode } from '@google/genai';
import { pedroContext, chatbotInstructions } from '../context/pedro-info.js';
import { setCorsHeaders } from '../lib/cors.js';

const saveLeadDeclaration = {
  name: 'save_lead',
  description: 'Save contact information when a visitor provides their name and email/phone to get in touch with Pedro.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name:    { type: Type.STRING, description: 'Full name of the person' },
      email:   { type: Type.STRING, description: 'Email address' },
      phone:   { type: Type.STRING, description: 'Phone number' },
      message: { type: Type.STRING, description: 'What they want to discuss or context' },
    },
    required: ['name'],
  },
};

async function saveLeadToSheet(args) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('GOOGLE_SHEETS_WEBHOOK_URL not configured');
    return { success: false, error: 'Webhook not configured' };
  }
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  return { success: res.ok };
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function conversationContainsEmail(message, history) {
  if (EMAIL_REGEX.test(message)) return true;
  return history.some(msg => msg.role === 'user' && EMAIL_REGEX.test(msg.content));
}

/**
 * Main chat endpoint handler
 * @param {Request} req - Incoming request
 * @param {Response} res - Response object
 */
export default async function handler(req, res) {
  setCorsHeaders(req, res);
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { message, conversationHistory: rawHistory } = req.body;

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

    // Validate and sanitize conversationHistory
    const conversationHistory = (Array.isArray(rawHistory) ? rawHistory : [])
      .filter(msg =>
        msg && typeof msg === 'object'
        && ['user', 'assistant'].includes(msg.role)
        && typeof msg.content === 'string'
        && msg.content.length <= 2000
      )
      .slice(-20)
      .map(({ role, content }) => ({ role, content }));

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

    const systemPrompt = `${chatbotInstructions}\n\n## Pedro's Information:\n${pedroContext}`;

    // Build structured Content[]
    const contents = [];
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const generateConfig = {
      model: 'gemini-2.5-flash-lite',
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: [saveLeadDeclaration] }],
      },
    };

    // Generate response using Gemini
    let response = await ai.models.generateContent(generateConfig);

    // Fallback: if no function call but conversation contains an email, force extraction
    if (!response.functionCalls?.length && process.env.GOOGLE_SHEETS_WEBHOOK_URL
        && conversationContainsEmail(message, conversationHistory)) {
      response = await ai.models.generateContent({
        ...generateConfig,
        config: {
          ...generateConfig.config,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['save_lead'],
            },
          },
        },
      });
    }

    // Handle function call (from first or fallback attempt)
    if (response.functionCalls?.length > 0) {
      const call = response.functionCalls[0];

      let result = { success: false };
      if (call.name === 'save_lead') {
        result = await saveLeadToSheet(call.args);
      }

      // Send function result back to get final text response
      contents.push(response.candidates[0].content);
      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name: call.name, response: { result } } }],
      });

      response = await ai.models.generateContent(generateConfig);
    }

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
