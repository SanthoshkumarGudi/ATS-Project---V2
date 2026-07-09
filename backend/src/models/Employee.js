// backend/src/models/Employee.js
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    department: { type: String },
    currentRole: { type: String },
    location: { type: String },
    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ["available", "on-bench", "not-available"],
      default: "available",
    },
    resumeUrl: { type: String },
    resumePublicId: { type: String },
    notes: { type: String },
    sourceCandidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema);