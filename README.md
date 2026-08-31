# ScribeCraft AI v2.0

ScribeCraft AI is a production-ready AI writing assistant platform offering an advanced document editor, multi-domain AI content detection, and a humanizer pipeline.

## Features

- **AI Humanizer**: A robust multi-stage pipeline utilizing Google Gemini to rewrite AI-generated text, enhancing naturalness and style while preserving factual meaning.
- **AI Content Detector**: Fuses rule-based linguistic engine with a Mock ML model integration to accurately detect AI-generated text across varying levels of sensitivities (Conservative, Balanced, Strict).
- **Editor & Dashboard**: Modern, dark-themed UI built with React. Includes grammar checking, paraphrasing, and a real-time document saving system.

## Setup Instructions

### Requirements
- Node.js
- SQLite3
- Gemini API Key

### Environment Variables
Create a `.env` file in the `server` directory with the following variables:
```
PORT=3000
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```

2. Install dependencies for the client:
   ```bash
   cd client
   npm install
   ```

### Running the Application

You can start both the client and server concurrently using the root package.json if configured, or run them in separate terminals:

**Terminal 1 (Server):**
```bash
cd server
npm start
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

## Architecture

- **Frontend**: React (Vite)
- **Backend**: Express.js
- **Database**: SQLite3
- **AI Engine**: Google Gemini API integration (via `@google/genai` or direct API depending on implementation setup)
 
