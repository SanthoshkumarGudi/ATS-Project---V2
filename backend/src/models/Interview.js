// backend/src/models/Interview.js
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    roundType: {
      type: String,
      enum: ["hr", "tech", "manager"],
      required: true,
    },
    roundNumber: { type: Number, default: 1 }, // supports repeats, e.g. Technical Round 2
    scheduledAt: { type: Date, required: true },
    interviewerName: { type: String, required: true },
    interviewerEmail: { type: String, required: true }, // required — feedback can only be submitted via the emailed link
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    meetingLink: String,
    feedbackToken: { type: String },
    feedbackTokenExpires: { type: Date },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      notes: String,
      recommendation: {
        type: String,
        enum: ["proceed", "repeat", "reject", "hold"],
      },
      negotiatedSalary: { type: String },
      noticePeriod: { type: String },
    },
    feedbackAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Interview", interviewSchema);