import React, { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://quiz-automata-backend.onrender.com/api";
const subjects = [
  { id: "FSWD", name: "Full Stack Web Development", detail: "HTML • CSS • JavaScript • React • Node.js • Express • MongoDB", icon: "💻" },
  { id: "CN", name: "Computer Networks", detail: "OSI • TCP/IP • DNS • HTTP • TCP/UDP • Routing", icon: "🌐" },
  { id: "FLAT", name: "Formal Languages and Automata Theory", detail: "DFA • NFA • Regular Expressions • Grammar • Languages", icon: "⚙️" }
];

export default function App() {
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [screen, setScreen] = useState("home");
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (screen !== "quiz") return;
    if (seconds <= 0) { submitQuiz(); return; }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, seconds]);

  const current = questions[index];
  const timeText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  async function startQuiz(id) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/quiz/${id}`);
      if (!response.ok) throw new Error("Could not load questions. Check that the backend is running.");
      const data = await response.json();
      setSubject(id); setQuestions(data.questions); setAnswers({}); setIndex(0);
      setSeconds(300); setResult(null); setScreen("quiz");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function submitQuiz() {
    if (screen !== "quiz" || !questions.length) return;
    setScreen("submitting");
    try {
      const response = await fetch(`${API}/quiz/evaluate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, answers, questionIds: questions.map(q => q.id) })
      });
      if (!response.ok) throw new Error("Evaluation failed. Please try again.");
      setResult(await response.json()); setScreen("result");
    } catch (e) { setError(e.message); setScreen("quiz"); }
  }

  const answered = Object.keys(answers).length;
  if (screen === "home") return <main className="page">
    <header className="top"><div className="brand">⟡ QUIZ<span>FLOW</span></div><span className="tag">FINITE AUTOMATA POWERED</span></header>
    <section className="hero"><div className="eyebrow">SMART ASSESSMENT PLATFORM</div><h1>Learn. Attempt.<br/><span>Evaluate Automatically.</span></h1>
      <p>An online assessment system covering FSWD, Computer Networks and Formal Languages & Automata Theory.</p>
      <div className="stats"><div><b>03</b><small>SUBJECTS</small></div><div><b>MCQ</b><small>QUESTION FORMAT</small></div><div><b>100%</b><small>AUTO EVALUATION</small></div></div>
    </section>
    <section className="subjects"><div className="section-head"><div><div className="eyebrow">CHOOSE YOUR SUBJECT</div><h2>Start an assessment</h2></div><span className="muted">5 questions • 5 minutes</span></div>
      <div className="cards">{subjects.map(s => <article className="subject-card" key={s.id}>
        <div className="subject-icon">{s.icon}</div><div className="code">{s.id}</div><h3>{s.name}</h3><p>{s.detail}</p>
        <button onClick={() => startQuiz(s.id)} disabled={loading}>{loading ? "Loading..." : "Start quiz →"}</button>
      </article>)}</div>
      {error && <p className="error">{error}</p>}
    </section>
    <footer>ONLINE QUIZ & AUTOMATIC EVALUATION SYSTEM <span>•</span> BUILT USING FINITE AUTOMATA</footer>
  </main>;

  if (screen === "submitting") return <main className="center"><div className="loader"></div><h2>Evaluating your answers...</h2><p>Finite-state evaluation in progress.</p></main>;

  if (screen === "result" && result) return <main className="page result-page">
    <header className="top"><div className="brand">⟡ QUIZ<span>FLOW</span></div><span className="tag">ASSESSMENT REPORT</span></header>
    <section className="result-card"><div className="eyebrow">QUIZ COMPLETED • {subject}</div><h1>Your result is ready.</h1>
      <div className="score-circle"><strong>{result.score}/{result.total}</strong><small>YOUR SCORE</small></div>
      <h2>{result.percentage}%</h2><p className="muted">Overall performance</p>
      <div className="result-grid"><div><b>{result.correct}</b><small>Correct</small></div><div><b>{result.wrong}</b><small>Incorrect</small></div><div><b>{result.unanswered}</b><small>Unanswered</small></div></div>
      <div className="automata-note"><b>Automata evaluation:</b> {result.automataMessage}</div>
      <button onClick={() => { setScreen("home"); setError(""); }}>Back to subjects</button>
    </section>
    <section className="review"><h2>Answer review</h2>{result.review.map((r, i) => <div className="review-row" key={r.id}><b>Q{i+1}. {r.question}</b><p className={r.isCorrect ? "good" : "bad"}>{r.isCorrect ? "Correct" : "Incorrect"} • Correct answer: {r.correctAnswer}</p></div>)}</section>
  </main>;

  return <main className="quiz-wrap"><header className="top"><div className="brand">⟡ QUIZ<span>FLOW</span></div><div className="timer">◷ {timeText}</div></header>
    <section className="quiz-panel"><div className="quiz-meta"><span>{subject} ASSESSMENT</span><span>QUESTION {index + 1} OF {questions.length}</span></div>
      <div className="progress"><div style={{width: `${((index+1)/questions.length)*100}%`}}></div></div>
      <h1>{current?.question}</h1><div className="options">{current?.options.map((option, i) => <button key={option} className={`option ${answers[current.id] === option ? "selected" : ""}`} onClick={() => setAnswers(a => ({...a, [current.id]: option}))}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>
      <div className="quiz-footer"><span>{answered} of {questions.length} answered</span><div>
        <button className="secondary" disabled={index===0} onClick={() => setIndex(i => i-1)}>Previous</button>
        {index < questions.length-1 ? <button onClick={() => setIndex(i => i+1)}>Next question →</button> : <button onClick={submitQuiz}>Submit assessment</button>}
      </div></div>
    </section>
    <p className="quiz-hint">Your answers are evaluated automatically when you submit.</p>
  </main>;
}
