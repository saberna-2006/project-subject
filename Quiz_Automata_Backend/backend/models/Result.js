const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ["FSWD", "CN", "FLAT"]
  },
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  correct: Number,
  wrong: Number,
  unanswered: Number,
  percentage: Number
}, { timestamps: true });

module.exports = mongoose.model("Result", resultSchema);