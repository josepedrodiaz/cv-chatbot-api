# CV Chatbot API

AI chatbot microservice for Pedro Díaz's portfolio website, powered by Google Gemini API.

## 🚀 Overview

This serverless API provides an intelligent chatbot that answers questions about Pedro's professional background, skills, and experience. It's designed to be integrated into the portfolio website as a floating chat widget.

## ✨ Features

- 🤖 **AI-Powered**: Uses Google Gemini API for natural language responses
- ⚡ **Serverless**: Runs on Vercel Functions (free tier)
- 🔒 **Secure**: API keys stored as environment variables
- 🌐 **CORS Enabled**: Ready for cross-origin requests
- 📝 **Conversation History**: Maintains chat context
- 🛡️ **Input Validation**: Rate limiting and message length checks
- 💬 **Professional Tone**: Configured to represent Pedro accurately

## 🏗️ Architecture

```
Portfolio Website (GitHub Pages)
         ↓ fetch('/api/chat')
    CV Chatbot API (Vercel)
         ↓ Gemini API call
    Google Gemini AI
         ↓ AI response
    Return to Portfolio
```

## 📋 Prerequisites

- Node.js 18+
- Vercel account (free tier)
- Google Gemini API key ([Get it free](https://makersuite.google.com/app/apikey))

## 🔧 Setup

### 1. Clone and Install

```bash
git clone https://github.com/josepedrodiaz/cv-chatbot-api.git
cd cv-chatbot-api
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Run Locally

```bash
npm run dev
```

API will be available at: `http://localhost:3000/api/chat`

### 4. Test the API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are Pedro'\''s main skills?"}'
```

## 🚢 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Add environment variable in Vercel dashboard:
   - Go to your project settings
   - Add `GEMINI_API_KEY`
   - Apply to Production, Preview, Development

Your API will be live at: `https://your-project.vercel.app/api/chat`

## 📡 API Reference

### POST /api/chat

Send a message to the chatbot.

**Request Body:**
```json
{
  "message": "What technologies does Pedro work with?",
  "conversationHistory": []
}
```

**Success Response (200):**
```json
{
  "success": true,
  "response": "Pedro Díaz specializes in WordPress, PHP, Laravel...",
  "timestamp": "2026-01-29T15:30:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

## 🔐 Security

- API keys stored in environment variables (never in code)
- Input validation (max 500 characters, conversation history validated and sanitized)
- CORS restricted to `josepedrodiaz.com` and `www.josepedrodiaz.com` in production (localhost only in development)
- Webhook URL guard on lead capture function

## 📝 Updating Information

To update Pedro's professional information:

1. Edit `context/pedro-info.js`
2. Update the `pedroContext` string
3. Test locally: `npm run dev`
4. Deploy: `vercel --prod`

## 🔍 Troubleshooting

**"API key not configured"**
- Check `.env` file exists with valid key
- Verify environment variable in Vercel dashboard

**CORS errors**
- CORS is configured in `lib/cors.js` — production only allows `josepedrodiaz.com`
- Localhost origins are added automatically when `NODE_ENV !== 'production'`

**Rate limit errors**
- Gemini 2.5 Flash Lite free tier: 10 RPM, 25 RPD
- Daily limit resets at midnight Pacific Time

## 📦 Project Structure

```
cv-chatbot-api/
├── api/
│   ├── chat.js              # Main chat endpoint (Gemini + function calling)
│   └── health.js            # Health check endpoint
├── context/
│   └── pedro-info.js        # Pedro's professional context
├── lib/
│   └── cors.js              # Centralized CORS configuration
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example environment file
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── package-lock.json       # Locked dependency versions
├── vercel.json             # Vercel config
├── CLAUDE.md               # Development guidelines
└── README.md               # This file
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Platform**: Vercel Serverless Functions
- **AI**: Google Gemini API
- **Package Manager**: npm

## 📄 License

MIT

## 👤 Author

**Pedro Díaz**
- Portfolio: [josepedrodiaz.github.io](https://josepedrodiaz.github.io)
- GitHub: [@josepedrodiaz](https://github.com/josepedrodiaz)
- LinkedIn: [josepedrodiaz](https://www.linkedin.com/in/josepedrodiaz)

---

Built with ❤️ using Google Gemini AI
