# AI Teacher (Maths + Science)

An interactive, human-like AI teacher you can run for free on your own machine.

This app includes:
- A web chat interface (React + Vite)
- A backend API (Node + Express)
- Gemini API integration (free tier available)
- Teaching modes: Tutor, Quiz me, Exam revision, Homework helper
- Student level controls: primary to college beginner

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI model runtime: Gemini API

## 1) Prerequisites

Install these first:
- Node.js 18+
- npm
- A Gemini API key (Google AI Studio)

## 2) Install Dependencies

From the project root:

```bash
npm install
npm run install:all
```

## 3) Configure Backend Environment

Copy the example env file:

```bash
cp backend/.env.example backend/.env
```

Default values are already good for local use:

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

## 4) Run the App

Start the app (backend + frontend) from project root:

```bash
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend health check: http://localhost:3001/api/health

## Project Structure

```text
ai_teacher/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── .gitignore
├── package.json
└── README.md
```

## Notes

- If chat fails, check your `GEMINI_API_KEY` in `backend/.env`.
- You can change the model in `backend/.env` (for example `gemini-2.0-flash`).
- The backend keeps recent chat context to stay conversational.