import { useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api/chat";

const starterPrompts = [
  "Explain photosynthesis like I am 12.",
  "Help me solve: 3x + 7 = 22",
  "Quiz me on Newton's laws.",
  "Teach me fractions with easy examples."
];

function App() {
  const [subject, setSubject] = useState("Maths");
  const [level, setLevel] = useState("Middle school");
  const [mode, setMode] = useState("Tutor");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I am your AI teacher. I can help with Maths and Science, explain step by step, and quiz you. What are you learning today?"
    }
  ]);

  const historyForApi = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          subject,
          level,
          mode,
          history: historyForApi
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the AI model just now. Please confirm Ollama is running and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Interactive AI Teacher</p>
        <h1>Learn Maths and Science with a human-style tutor</h1>
        <p>
          Ask questions, request simple explanations, and practice with quiz mode. Runs fully free with a local model.
        </p>
      </header>

      <section className="controls">
        <label>
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option>Maths</option>
            <option>Science</option>
          </select>
        </label>

        <label>
          Level
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option>Primary school</option>
            <option>Middle school</option>
            <option>High school</option>
            <option>College beginner</option>
          </select>
        </label>

        <label>
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Tutor</option>
            <option>Quiz me</option>
            <option>Exam revision</option>
            <option>Homework helper</option>
          </select>
        </label>
      </section>

      <section className="chat">
        <div className="messages">
          {messages.map((msg, idx) => (
            <article key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
              <strong>{msg.role === "assistant" ? "Teacher" : "You"}</strong>
              <p>{msg.content}</p>
            </article>
          ))}
          {loading && (
            <article className="bubble assistant">
              <strong>Teacher</strong>
              <p>Thinking...</p>
            </article>
          )}
        </div>

        <div className="starter-prompts">
          {starterPrompts.map((prompt) => (
            <button key={prompt} onClick={() => sendMessage(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question, for example: Why does acceleration increase force?"
            rows={3}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Sending..." : "Ask teacher"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}

export default App;
