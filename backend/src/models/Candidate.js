// backend/src/models/Candidate.js
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    location: { type: String },

    resumeUrl: { type: String, required: true }, // Cloudinary URL
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
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    onboarding: {
      offerSentAt: Date,
      offerAcceptedAt: Date,
      documentsCollected: { type: Boolean, default: false },
      onboardingDate: Date,
    },
    availability: {
      token: { type: String },
      tokenExpires: { type: Date },
      requestedAt: { type: Date },
      submittedAt: { type: Date },
      slots: [{ type: String }],
      notes: { type: String },
    },
    convertedToEmployee: { type: Boolean, default: false },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true },
);
candidateSchema.methods.setStatus = function (newStatus) {
  if (this.status !== newStatus) {
    this.status = newStatus;
    this.statusHistory.push({ status: newStatus, changedAt: new Date() });
  }
};

module.exports = mongoose.model("Candidate", candidateSchema);
