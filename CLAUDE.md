# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

**General Instructions**: See `~/.claude-instructions.md` for git workflow, versioning, and general coding conventions that apply to all Pedro Díaz's personal projects.

## Project Overview

This is a serverless API microservice that powers the AI chatbot on Pedro Díaz's portfolio website. It uses Google Gemini API to provide intelligent responses about Pedro's professional background, skills, and experience.

## Architecture

**Type**: Serverless API (Vercel Functions)
**AI Provider**: Google Gemini API (free tier)
**Language**: Node.js (ES modules)
**Deployment**: Vercel

### How It Works

1. **Portfolio site** (GitHub Pages) sends user message via fetch
2. **This API** receives the message at `/api/chat` endpoint
3. **Gemini AI** processes the message with Pedro's context
4. **API** returns the AI response
5. **Portfolio site** displays response in chat widget

## File Structure

```
cv-chatbot-api/
├── api/
│   └── chat.js              # Main API endpoint handler
├── context/
│   └── pedro-info.js        # Pedro's professional context for AI
├── .env                     # Environment variables (not in git)
├── .env.example             # Example env file
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel deployment config
├── CLAUDE.md               # This file
└── README.md               # Setup and usage instructions
```

## Key Files

### api/chat.js
Main API endpoint that:
- Handles POST requests from portfolio site
- Validates input (message length, format)
- Calls Gemini API with Pedro's context
- Manages conversation history
- Returns AI-generated responses
- Implements CORS for cross-origin requests
- Error handling for API failures, rate limits, etc.

### context/pedro-info.js
Contains two main exports:
- `pedroContext`: Detailed information about Pedro's skills, experience, and projects
- `chatbotInstructions`: Guidelines for how the AI should respond

**When updating**: Keep information accurate, professional, and concise. The AI uses this as its knowledge base about Pedro.

### vercel.json
Vercel deployment configuration:
- Defines serverless function routing
- Configures environment variables
- Sets up Node.js runtime

## Development

### Prerequisites
- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Google Gemini API key (free at https://makersuite.google.com/app/apikey)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Test endpoint at: `http://localhost:3000/api/chat`

### Testing the API

Using curl:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are Pedro'\''s main skills?"}'
```

Expected response:
```json
{
  "success": true,
  "response": "Pedro Díaz is a Senior Full-Stack Developer...",
  "timestamp": "2026-01-29T..."
}
```

## Deployment

### Initial Deployment to Vercel

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Add environment variable in Vercel dashboard:
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Add: `GEMINI_API_KEY` with your API key
   - Select: Production, Preview, Development

4. Your API will be live at: `https://your-project.vercel.app/api/chat`

### Updating Production

After making changes:
```bash
npm run deploy
```

Or simply:
```bash
git push
```
(if you've connected Vercel to your GitHub repository)

## API Usage

### Endpoint
```
POST https://your-project.vercel.app/api/chat
```

### Request Format
```json
{
  "message": "What technologies does Pedro work with?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous AI response"
    }
  ]
}
```

### Response Format
```json
{
  "success": true,
  "response": "AI-generated response text",
  "timestamp": "2026-01-29T12:34:56.789Z"
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

## Security & Best Practices

### Environment Variables
- **NEVER** commit `.env` file
- Store API keys in Vercel environment variables
- Use different keys for development and production

### CORS
- Currently set to `*` (allow all origins) for development
- **In production**: Update `corsHeaders` in `api/chat.js` to only allow your portfolio domain:
  ```javascript
  'Access-Control-Allow-Origin': 'https://josepedrodiaz.github.io'
  ```

### Rate Limiting
- Gemini free tier: 60 requests/minute
- Consider implementing client-side throttling in portfolio site
- Add server-side rate limiting if needed

### Input Validation
- Maximum message length: 500 characters
- Only accepts POST requests
- Validates message format

## Updating Pedro's Information

When Pedro's professional information changes:

1. Edit `context/pedro-info.js`
2. Update `pedroContext` with new information
3. Keep information accurate and professional
4. Test locally with `npm run dev`
5. Deploy with `npm run deploy`

## Troubleshooting

### "API key not configured"
- Check `.env` file exists and contains `GEMINI_API_KEY`
- For production: verify environment variable in Vercel dashboard

### "Rate limit exceeded"
- Gemini free tier limit reached (60/min)
- Wait a moment and try again
- Consider caching responses for common questions

### CORS errors
- Verify `Access-Control-Allow-Origin` header
- Check portfolio site origin matches CORS config

### "500 Internal Server Error"
- Check Vercel function logs
- Verify Gemini API key is valid
- Check for syntax errors in recent changes

## Branch Information

- **Main branch**: `main` (production deployment)
- Vercel auto-deploys from `main` branch

## Future Enhancements

Potential improvements to consider:
- Add response caching for common questions
- Implement conversation memory/sessions
- Add analytics for popular questions
- Support for file attachments (resume, etc.)
- Multi-language support matching portfolio
- Rate limiting per IP address
