# AI Teacher (Maths + Science)

An interactive, human-like AI teacher you can run for free on your own machine.

This app includes:
- A web chat interface (React + Vite)
- A backend API (Node + Express)
- Local AI model support through Ollama (free, no paid API needed)
- Teaching modes: Tutor, Quiz me, Exam revision, Homework helper
- Student level controls: primary to college beginner

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI model runtime: Ollama (local)

## 1) Prerequisites

Install these first:
- Node.js 18+
- npm
- Ollama

Linux install for Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

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
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=smollm2:135m
OLLAMA_MODELS=smollm2:135m,tinyllama:latest
```

`OLLAMA_MODELS` is optional. If set, the backend will try each model in order until one works.

Pull at least one model before running (small defaults):

```bash
ollama pull smollm2:135m
```

## 4) Run the App

Start Ollama in one terminal:

```bash
ollama serve
```

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

- If chat fails, make sure `ollama serve` is running.
- You can change the model in `backend/.env` (for example `smollm2:135m`).
- You can configure automatic fallback using `OLLAMA_MODELS` in `backend/.env`.
- The backend keeps recent chat context to stay conversational.