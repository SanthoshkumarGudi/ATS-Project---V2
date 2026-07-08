// backend/src/models/Candidate.js
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    location: { type: String },

    resumeUrl: { type: String, required: true },     // Cloudinary URL
    resumePublicId: { type: String },

    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ["fresher", "mid", "senior"],
      default: "fresher",
    },
    tags: [{ type: String }],
    source: {
      type: String,
      enum: ["public-upload", "hm-upload"],
      default: "public-upload",
    },

    status: {
      type: String,
      enum: [
        "new",
        "shortlisted",
        "tech-round",
        "manager-round",
        "hr-round",
        "final-evaluation",
        "hired",
        "offer-sent",
        "offer-accepted",
        "onboarding",
        "rejected",
        "on-hold",
      ],
      default: "new",
    },

    onboarding: {
      offerSentAt: Date,
      offerAcceptedAt: Date,
      documentsCollected: { type: Boolean, default: false },
      onboardingDate: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Candidate", candidateSchema);