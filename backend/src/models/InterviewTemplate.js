// backend/src/models/InterviewTemplate.js
const mongoose = require("mongoose");

const interviewTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rounds: {
      type: [{ type: String, enum: ["hr", "tech", "manager"] }],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "A template needs at least one round.",
      },
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("InterviewTemplate", interviewTemplateSchema);