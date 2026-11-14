require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const bank = require("./questions");
const { runAssessmentAutomaton } = require("./automata");
const connectDB = require("./db");
const User = require("./models/User");
const Result = require("./models/Result");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : true
}));

app.use(express.json());

// JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Login required." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// Optional authentication for existing quiz evaluation
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return next();

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// Home
app.get("/", (req, res) => {
  res.json({
    message: "Online Quiz and Automatic Evaluation API is running."
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, registerNumber, password } = req.body;

    if (!name || !registerNumber || !password) {
      return res.status(400).json({
        message: "Name, register number and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters."
      });
    }

    const existingUser = await User.findOne({
      registerNumber: registerNumber.trim().toUpperCase()
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Register number already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      registerNumber: registerNumber.trim().toUpperCase(),
      password: hashedPassword
    });

    res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        registerNumber: user.registerNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { registerNumber, password } = req.body;

    if (!registerNumber || !password) {
      return res.status(400).json({
        message: "Register number and password are required."
      });
    }

    const user = await User.findOne({
      registerNumber: registerNumber.trim().toUpperCase()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid register number or password."
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid register number or password."
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        registerNumber: user.registerNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        registerNumber: user.registerNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGGED-IN USER
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SUBJECTS
app.get("/api/subjects", (req, res) => {
  res.json({
    subjects: [
      {
        id: "FSWD",
        name: "Full Stack Web Development",
        questionCount: bank.FSWD.length
      },
      {
        id: "CN",
        name: "Computer Networks",
        questionCount: bank.CN.length
      },
      {
        id: "FLAT",
        name: "Formal Languages and Automata Theory",
        questionCount: bank.FLAT.length
      }
    ]
  });
});

// LOAD QUIZ
app.get("/api/quiz/:subject", (req, res) => {
  const subject = req.params.subject.toUpperCase();

  if (!bank[subject]) {
    return res.status(404).json({ message: "Subject not found." });
  }

  const events = ["SELECT_SUBJECT", "LOAD_QUESTIONS"];
  const automaton = runAssessmentAutomaton(events);

  if (!automaton.accepted) {
    return res.status(400).json({ message: automaton.message });
  }

  const questions = bank[subject].map(
    ({ answer, ...publicQuestion }) => publicQuestion
  );

  res.json({
    subject,
    questions,
    total: questions.length
  });
});

// EVALUATE QUIZ
app.post("/api/quiz/evaluate", optionalAuth, async (req, res) => {
  try {
    const { subject, answers = {}, questionIds = [] } = req.body;

    const key = String(subject || "").toUpperCase();

    if (!bank[key]) {
      return res.status(400).json({
        message: "Valid subject is required."
      });
    }

    const events = [
      "SELECT_SUBJECT",
      "LOAD_QUESTIONS",
      "SUBMIT",
      "GRADE"
    ];

    const automaton = runAssessmentAutomaton(events);

    if (!automaton.accepted) {
      return res.status(400).json({
        message: automaton.message
      });
    }

    const selected = questionIds.length
      ? bank[key].filter(q => questionIds.includes(q.id))
      : bank[key];

    if (!selected.length) {
      return res.status(400).json({
        message: "No valid questions submitted."
      });
    }

    let correct = 0;

    const review = selected.map(q => {
      const isCorrect = answers[q.id] === q.answer;

      if (isCorrect) correct++;

      return {
        id: q.id,
        question: q.question,
        isCorrect,
        correctAnswer: q.answer,
        submittedAnswer: answers[q.id] || "Not answered"
      };
    });

    const total = selected.length;

    const wrong = review.filter(
      r => r.submittedAnswer !== "Not answered" && !r.isCorrect
    ).length;

    const unanswered = review.filter(
      r => r.submittedAnswer === "Not answered"
    ).length;

    const percentage = Math.round((correct / total) * 100);

    let saved = false;
    let resultId = null;

    // Save result when a logged-in user submits the quiz
    if (req.user) {
      try {
        const result = await Result.create({
          userId: req.user.userId,
          subject: key,
          score: correct,
          total,
          correct,
          wrong,
          unanswered,
          percentage
        });

        saved = true;
        resultId = result._id;
      } catch (saveError) {
        console.error("Result saving failed:", saveError.message);
      }
    }

    res.json({
      subject: key,
      score: correct,
      total,
      correct,
      wrong,
      unanswered,
      percentage,
      automataState: automaton.state,
      automataMessage: automaton.message,
      review,
      saved,
      resultId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// QUIZ HISTORY
app.get("/api/results/my", authenticateToken, async (req, res) => {
  try {
    const results = await Result.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DASHBOARD AND SUBJECT-WISE PERFORMANCE
app.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const results = await Result.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    const subjectPerformance = ["FSWD", "CN", "FLAT"].map(subject => {
      const subjectResults = results.filter(
        result => result.subject === subject
      );

      const attempts = subjectResults.length;

      const averagePercentage = attempts
        ? Math.round(
            subjectResults.reduce((sum, r) => sum + r.percentage, 0) / attempts
          )
        : 0;

      return {
        subject,
        attempts,
        averagePercentage
      };
    });

    res.json({
      user: {
        name: user.name,
        registerNumber: user.registerNumber
      },
      totalQuizzes: results.length,
      averagePercentage: results.length
        ? Math.round(
            results.reduce((sum, r) => sum + r.percentage, 0) / results.length
          )
        : 0,
      subjectPerformance,
      recentResults: results.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// START SERVER AFTER DATABASE CONNECTION
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Quiz API running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });