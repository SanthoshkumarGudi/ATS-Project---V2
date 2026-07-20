// backend/src/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://ats-project-v2-hvot.onrender.com"],
    credentials: true,
  }),
);
app.use(express.json());



const User = require("./models/User");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const { sendInterviewEmail } = require("./utils/emailService");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Locally (atsdb)"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ==================== ROUTES ====================
app.use("/api/resumes", require("./routes/resumes"));       // public upload
app.use("/api/candidates", require("./routes/candidates")); // talent pool (protected)
app.use("/api/interviews", require("./routes/interviews")); // protected
app.use("/api/employees", require("./routes/employees"));   // internal directory (protected)
app.use("/api/auth", require("./routes/auth"));              // protected /me + verify-email + resend-verification

// ==================== REGISTER (creates a Hiring Manager account — unverified) ====================
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcryptjs.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "hiring_manager",
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    await sendInterviewEmail(
      user.email,
      "Verify your email",
      `<h2>Welcome to Prixgen ATS</h2><p>Click below to verify your email and activate your Hiring Manager account:</p>
       <a href="${verifyUrl}" style="background:#1f8f86;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a>`,
    );

    // No login token issued — the account is unverified and login is blocked until verified.
    res.status(201).json({
      message: "Account created. Please check your email to verify your account before logging in.",
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== LOGIN ====================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== GOOGLE LOGIN ====================
// Google already verifies the email on their end, so these accounts are marked verified immediately.
app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: null,
        role: "hiring_manager",
        isVerified: true,
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

// Global error handler — catches anything that slips past individual route try/catch blocks
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});