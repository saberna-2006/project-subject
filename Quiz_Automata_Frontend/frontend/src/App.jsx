
import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://quiz-automata-backend.onrender.com/api";

const subjects = [
  { id: "FSWD", name: "Full Stack Web Development", detail: "HTML • CSS • JavaScript • React • Node.js • Express • MongoDB", icon: "💻" },
  { id: "CN", name: "Computer Networks", detail: "OSI • TCP/IP • DNS • HTTP • TCP/UDP • Routing", icon: "🌐" },
  { id: "FLAT", name: "Formal Languages and Automata Theory", detail: "DFA • NFA • Regular Expressions • Grammar • Languages", icon: "⚙️" }
];


const panelStyle = {
  maxWidth: "850px",
  margin: "35px auto",
  padding: "30px",
  background: "linear-gradient(145deg, #111a32, #172344)",
  color: "#ffffff",
  border: "1px solid rgba(138,124,255,0.25)",
  borderRadius: "18px",
  boxShadow: "0 15px 45px rgba(0,0,0,0.3)"
};

const fieldStyle = {
  width: "100%",
  padding: "13px",
  margin: "8px 0 17px",
  border: "1px solid #8a7cff",
  borderRadius: "9px",
  fontSize: "15px",
  fontWeight: "700",
  color: "#17203a",
  background: "#ffffff",
  boxSizing: "border-box"
};

const actionStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "9px",
  background: "linear-gradient(135deg, #6546d7, #9284ff)",
  color: "white",
  cursor: "pointer",
  fontWeight: "800",
  margin: "5px"
};


export default function App() {
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [screen, setScreen] = useState("auth");
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("quizflow_token") || "");
  const [user, setUser] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);

  const current = questions[index];
  const answered = Object.keys(answers).length;
  const timeText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  // Restore login after refreshing the page
  useEffect(() => {
    async function verifyLogin() {
      if (!token) return;

      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Session expired");

        const data = await response.json();
        setUser(data.user);
        setScreen("home");
      } catch {
        localStorage.removeItem("quizflow_token");
        setToken("");
        setScreen("auth");
      }
    }

    verifyLogin();
  }, []);

  // Quiz timer
  useEffect(() => {
    if (screen !== "quiz") return;

    if (seconds <= 0) {
      submitQuiz();
      return;
    }

    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, seconds]);

  // Register or Login
  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = authMode === "login" ? "login" : "register";

      const body = authMode === "login"
        ? { registerNumber, password }
        : { name, registerNumber, password };

      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Authentication failed.");

      if (authMode === "register") {
        setMessage("Registration successful! Please login with your details.");
        setAuthMode("login");
        setPassword("");
      } else {
        localStorage.setItem("quizflow_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setScreen("home");
        setMessage("");
        setPassword("");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Logout
  function logout() {
    localStorage.removeItem("quizflow_token");
    setToken("");
    setUser(null);
    setDashboard(null);
    setHistory([]);
    setScreen("auth");
    setAuthMode("login");
    setError("");
    setMessage("You have been logged out.");
  }

  // Load dashboard
  async function openDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load dashboard.");

      setDashboard(data);
      setScreen("dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Load quiz history
  async function openHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/results/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load quiz history.");

      setHistory(data.results || []);
      setScreen("history");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Start quiz
  async function startQuiz(id) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/quiz/${id}`);
      if (!response.ok) throw new Error("Could not load questions. Check the backend.");

      const data = await response.json();

      setSubject(id);
      setQuestions(data.questions);
      setAnswers({});
      setIndex(0);
      setSeconds(300);
      setResult(null);
      setScreen("quiz");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Submit and evaluate quiz
  async function submitQuiz() {
    if (screen !== "quiz" || !questions.length) return;

    setScreen("submitting");

    try {
      const response = await fetch(`${API}/quiz/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          answers,
          questionIds: questions.map(q => q.id)
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Evaluation failed.");

      setResult(data);
      setScreen("result");
    } catch (e) {
      setError(e.message);
      setScreen("quiz");
    }
  }

  // AUTH SCREEN
  if (screen === "auth") {
    return (
      <main className="page">
        <header className="top">
          <div className="brand">⟡ QUIZ<span>FLOW</span></div>
          <span className="tag">STUDENT PORTAL</span>
        </header>

        <section style={{ ...panelStyle, maxWidth: "430px", marginTop: "65px" }}>
          <div className="eyebrow">SMART ASSESSMENT PLATFORM</div>
          <h1 style={{ marginBottom: "8px" }}>
            {authMode === "login" ? "Welcome Back!" : "Create Account"}
          </h1>
          <p className="muted">
            {authMode === "login"
              ? "Login to access your QuizFlow dashboard."
              : "Register to start your assessments."}
          </p>

          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <>
                <label>Student Name</label>
                <input
                  style={fieldStyle}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </>
            )}

            <label>Register Number</label>
            <input
              style={fieldStyle}
              value={registerNumber}
              onChange={e => setRegisterNumber(e.target.value)}
              placeholder="Enter register number"
              required
            />

            <label>Password</label>
            <input
              style={fieldStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />

            {error && <p className="error">{error}</p>}
            {message && <p className="good">{message}</p>}

            <button style={{ ...actionStyle, width: "100%", margin: "10px 0" }} disabled={loading}>
              {loading ? "Please wait..." : authMode === "login" ? "Login →" : "Register →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px" }}>
            {authMode === "login" ? "New student? " : "Already registered? "}
            <button
              style={{ ...actionStyle, background: "transparent", color: "#6546d7", padding: "5px" }}
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
                setMessage("");
              }}
            >
              {authMode === "login" ? "Create account" : "Login"}
            </button>
          </p>
        </section>

        <footer>ONLINE QUIZ & AUTOMATIC EVALUATION SYSTEM • FINITE AUTOMATA</footer>
      </main>
    );
  }

  // SUBMITTING SCREEN
  if (screen === "submitting") {
    return (
      <main className="center">
        <div className="loader"></div>
        <h2>Evaluating your answers...</h2>
        <p>Finite-state evaluation in progress.</p>
      </main>
    );
  }

  // DASHBOARD
  if (screen === "dashboard") {
    return (
      <main className="page">
        <header className="top">
          <div className="brand">⟡ QUIZ<span>FLOW</span></div>
          <div>
            <button style={actionStyle} onClick={() => setScreen("home")}>Home</button>
            <button style={actionStyle} onClick={openHistory}>Quiz History</button>
            <button style={actionStyle} onClick={logout}>Logout</button>
          </div>
        </header>

        <section style={panelStyle}>
          <div className="eyebrow">STUDENT DASHBOARD</div>
          <h1>Welcome, {dashboard?.user?.name || user?.name}!</h1>
          <p className="muted">Register Number: {dashboard?.user?.registerNumber || user?.registerNumber}</p>

          <div className="result-grid" style={{ margin: "25px 0" }}>
            <div><b>{dashboard?.totalQuizzes ?? 0}</b><small>Total Quizzes</small></div>
            <div><b>{dashboard?.averagePercentage ?? 0}%</b><small>Average Score</small></div>
            <div><b>03</b><small>Subjects</small></div>
          </div>

          <h2>Subject-wise Performance</h2>

          {dashboard?.subjectPerformance?.map(item => (
            <div key={item.subject} style={{ margin: "22px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{item.subject}</b>
                <span>{item.averagePercentage}% • {item.attempts} attempts</span>
              </div>
              <div style={{ background: "#eee", height: "10px", borderRadius: "10px", marginTop: "8px" }}>
                <div style={{
                  width: `${item.averagePercentage}%`,
                  background: "#6546d7",
                  height: "10px",
                  borderRadius: "10px"
                }} />
              </div>
            </div>
          ))}

          <button style={actionStyle} onClick={() => setScreen("home")}>Start a Quiz</button>
          <button style={actionStyle} onClick={openHistory}>View Quiz History</button>
        </section>
      </main>
    );
  }

  // QUIZ HISTORY
  if (screen === "history") {
    return (
      <main className="page">
        <header className="top">
          <div className="brand">⟡ QUIZ<span>FLOW</span></div>
          <div>
            <button style={actionStyle} onClick={() => setScreen("home")}>Home</button>
            <button style={actionStyle} onClick={openDashboard}>Dashboard</button>
            <button style={actionStyle} onClick={logout}>Logout</button>
          </div>
        </header>

        <section style={panelStyle}>
          <div className="eyebrow">STUDENT RECORDS</div>
          <h1>Quiz History</h1>
          <p className="muted">Your previous assessment results.</p>

          {history.length === 0 ? (
            <p style={{ marginTop: "25px" }}>No quiz attempts found. Start your first quiz!</p>
          ) : (
            history.map(item => (
              <div key={item._id} style={{
                border: "1px solid #eee", borderRadius: "12px",
                padding: "18px", margin: "15px 0"
              }}>
                <h3>{item.subject}</h3>
                <p>Score: <b>{item.score}/{item.total}</b></p>
                <p>Percentage: <b>{item.percentage}%</b></p>
                <p className="muted">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    );
  }

  // RESULT SCREEN
  if (screen === "result" && result) {
    return (
      <main className="page result-page">
        <header className="top">
          <div className="brand">⟡ QUIZ<span>FLOW</span></div>
          <span className="tag">ASSESSMENT REPORT</span>
        </header>

        <section className="result-card">
          <div className="eyebrow">QUIZ COMPLETED • {subject}</div>
          <h1>Your result is ready.</h1>
          <div className="score-circle">
            <strong>{result.score}/{result.total}</strong>
            <small>YOUR SCORE</small>
          </div>
          <h2>{result.percentage}%</h2>
          <p className="muted">Overall performance</p>

          <div className="result-grid">
            <div><b>{result.correct}</b><small>Correct</small></div>
            <div><b>{result.wrong}</b><small>Incorrect</small></div>
            <div><b>{result.unanswered}</b><small>Unanswered</small></div>
          </div>

          <div className="automata-note">
            <b>Automata evaluation:</b> {result.automataMessage}
          </div>

          {result.saved
            ? <p className="good">Your result has been saved to your account.</p>
            : <p className="muted">Result was not saved.</p>}

          <button onClick={() => { setScreen("home"); setError(""); }}>
            Back to subjects
          </button>
          <button style={{ ...actionStyle, marginLeft: "8px" }} onClick={openDashboard}>
            Dashboard
          </button>
        </section>

        <section className="review">
          <h2>Answer Review</h2>
          {result.review.map((r, i) => (
            <div className="review-row" key={r.id}>
              <b>Q{i + 1}. {r.question}</b>
              <p className={r.isCorrect ? "good" : "bad"}>
                {r.isCorrect ? "Correct" : "Incorrect"} • Correct answer: {r.correctAnswer}
              </p>
            </div>
          ))}
        </section>
      </main>
    );
  }

  // HOME / SUBJECT SELECTION
  if (screen === "home") {
    return (
      <main className="page">
        <header className="top">
          <div className="brand">⟡ QUIZ<span>FLOW</span></div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ marginRight: "10px" }}>Hi, {user?.name || "Student"}</span>
            <button style={actionStyle} onClick={openDashboard}>Dashboard</button>
            <button style={actionStyle} onClick={openHistory}>History</button>
            <button style={actionStyle} onClick={logout}>Logout</button>
          </div>
        </header>

        <section className="hero">
          <div className="eyebrow">SMART ASSESSMENT PLATFORM</div>
          <h1>Learn. Attempt.<br /><span>Evaluate Automatically.</span></h1>
          <p>An online assessment system covering FSWD, Computer Networks and Formal Languages & Automata Theory.</p>
          <div className="stats">
            <div><b>03</b><small>SUBJECTS</small></div>
            <div><b>MCQ</b><small>QUESTION FORMAT</small></div>
            <div><b>100%</b><small>AUTO EVALUATION</small></div>
          </div>
        </section>

        <section className="subjects">
          <div className="section-head">
            <div>
              <div className="eyebrow">CHOOSE YOUR SUBJECT</div>
              <h2>Start an assessment</h2>
            </div>
            <span className="muted">5 questions • 5 minutes</span>
          </div>

          <div className="cards">
            {subjects.map(s => (
              <article className="subject-card" key={s.id}>
                <div className="subject-icon">{s.icon}</div>
                <div className="code">{s.id}</div>
                <h3>{s.name}</h3>
                <p>{s.detail}</p>
                <button onClick={() => startQuiz(s.id)} disabled={loading}>
                  {loading ? "Loading..." : "Start quiz →"}
                </button>
              </article>
            ))}
          </div>

          {error && <p className="error">{error}</p>}
        </section>

        <footer>ONLINE QUIZ & AUTOMATIC EVALUATION SYSTEM • BUILT USING FINITE AUTOMATA</footer>
      </main>
    );
  }

  // QUIZ SCREEN
  return (
    <main className="quiz-wrap">
      <header className="top">
        <div className="brand">⟡ QUIZ<span>FLOW</span></div>
        <div className="timer">◷ {timeText}</div>
      </header>

      <section className="quiz-panel">
        <div className="quiz-meta">
          <span>{subject} ASSESSMENT</span>
          <span>QUESTION {index + 1} OF {questions.length}</span>
        </div>

        <div className="progress">
          <div style={{ width: `${((index + 1) / questions.length) * 100}%` }}></div>
        </div>

        <h1>{current?.question}</h1>

        <div className="options">
          {current?.options.map((option, i) => (
            <button
              key={option}
              className={`option ${answers[current.id] === option ? "selected" : ""}`}
              onClick={() => setAnswers(a => ({ ...a, [current.id]: option }))}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {option}
            </button>
          ))}
        </div>

        <div className="quiz-footer">
          <span>{answered} of {questions.length} answered</span>
          <div>
            <button
              className="secondary"
              disabled={index === 0}
              onClick={() => setIndex(i => i - 1)}
            >
              Previous
            </button>

            {index < questions.length - 1
              ? <button onClick={() => setIndex(i => i + 1)}>Next question →</button>
              : <button onClick={submitQuiz}>Submit assessment</button>}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      <p className="quiz-hint">Your answers are evaluated automatically when you submit.</p>
    </main>
  );
}
