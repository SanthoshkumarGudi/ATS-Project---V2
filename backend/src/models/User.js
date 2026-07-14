// backend/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["hiring_manager"],
    default: "hiring_manager",
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
