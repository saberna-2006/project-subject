const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true },
  unanswered: { type: Number, required: true },
  percentage: { type: Number, required: true },
  review: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
