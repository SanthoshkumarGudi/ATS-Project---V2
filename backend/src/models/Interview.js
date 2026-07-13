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
      enum: ["tech", "manager", "hr"],   // can be extended in the future
      required: true,
    },
    scheduledAt: { type: Date, required: true },
    interviewerName: { type: String, required: true }, // free text — no login needed
    interviewerEmail: { type: String }, // optional, only used to send a notification
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    meetingLink: String,
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      notes: String,
      recommendation: {
        type: String,
        enum: ["hire", "reject", "next-round", "hold"],
      },
      negotiatedSalary: { type: String },
      noticePeriod: { type: String },
    },
    feedbackAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Interview", interviewSchema);