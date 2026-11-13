require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bank = require("./questions");
const { runAssessmentAutomaton } = require("./automata");
const connectDB = require("./db");
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : true }));
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Online Quiz and Automatic Evaluation API is running." }));
app.get("/api/health", (req, res) => res.json({ status: "OK" }));
app.get("/api/subjects", (req, res) => res.json({
  subjects: [
    { id:"FSWD", name:"Full Stack Web Development", questionCount:bank.FSWD.length },
    { id:"CN", name:"Computer Networks", questionCount:bank.CN.length },
    { id:"FLAT", name:"Formal Languages and Automata Theory", questionCount:bank.FLAT.length }
  ]
}));
app.get("/api/quiz/:subject", (req, res) => {
  const subject = req.params.subject.toUpperCase();
  if (!bank[subject]) return res.status(404).json({ message: "Subject not found" });
  const events = ["SELECT_SUBJECT", "LOAD_QUESTIONS"];
  const automaton = runAssessmentAutomaton(events);
  if (!automaton.accepted) return res.status(400).json({ message: automaton.message });
  const questions = bank[subject].map(({ answer, ...publicQuestion }) => publicQuestion);
  res.json({ subject, questions, total: questions.length });
});
app.post("/api/quiz/evaluate", (req, res) => {
  const { subject, answers = {}, questionIds = [] } = req.body;
  const key = String(subject || "").toUpperCase();
  if (!bank[key]) return res.status(400).json({ message: "Valid subject is required." });
  const events = ["SELECT_SUBJECT", "LOAD_QUESTIONS", "SUBMIT", "GRADE"];
  const automaton = runAssessmentAutomaton(events);
  if (!automaton.accepted) return res.status(400).json({ message: automaton.message });

  const selected = questionIds.length
    ? bank[key].filter(q => questionIds.includes(q.id))
    : bank[key];
  if (!selected.length) return res.status(400).json({ message: "No valid questions submitted." });

  let correct = 0;
  const review = selected.map(q => {
    const isCorrect = answers[q.id] === q.answer;
    if (isCorrect) correct++;
    return {
      id: q.id, question: q.question, isCorrect,
      correctAnswer: q.answer,
      submittedAnswer: answers[q.id] || "Not answered"
    };
  });
  const total = selected.length;
  const wrong = review.filter(r => r.submittedAnswer !== "Not answered" && !r.isCorrect).length;
  const unanswered = review.filter(r => r.submittedAnswer === "Not answered").length;
  res.json({
    subject: key, score: correct, total, correct, wrong, unanswered,
    percentage: Math.round((correct / total) * 100),
    automataState: automaton.state, automataMessage: automaton.message, review
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Quiz API running on port ${PORT}`));
});
