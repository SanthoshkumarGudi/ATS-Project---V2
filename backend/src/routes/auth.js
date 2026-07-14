// backend/src/routes/auth.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendInterviewEmail } = require("../utils/emailService");

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/verify-email?token=...
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Verification token is required" });

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or already-used verification link" });
    }
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ message: "This verification link has expired. Please request a new one." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/resend-verification — public (a blocked/unverified user has no valid session)
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "No account found with that email" });
    if (user.isVerified) return res.status(400).json({ message: "This account is already verified — you can log in." });

    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
    await sendInterviewEmail(
      user.email,
      "Verify your email",
      `<h2>Verify your email</h2><p>Click below to verify your Hiring Manager account:</p>
       <a href="${verifyUrl}" style="background:#1f8f86;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a>`,
    );

    res.json({ message: "Verification email resent — please check your inbox." });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;