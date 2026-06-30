// / backend/src/models/CandidateProfile.js
const mongoose = require("mongoose");

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,   // This makes it a one-to-one relationship - each user can have only one candidate profile
    },
    image: { type: String }, // URL to profile picture
    name: { type: String, required: true },
    currentLocation: { type: String, required: true },
    targetJobTitle: { type: String, required: true },
    skills: [{ type: String }],
    preferredLocation: { type: String, required: true },
    noticePeriod: { type: Number, required: true },
    experience: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CandidateProfile", candidateProfileSchema);
