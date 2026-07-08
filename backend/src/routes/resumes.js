// backend/src/routes/resumes.js
const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");
const upload = require("../middleware/upload");
const { parseResumeFromUrl } = require("../utils/resumeParser");
const { computeTier } = require("../utils/tier");

// PUBLIC — no auth. Anyone with the link can submit a resume.
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const resumeUrl = req.file.path; // Cloudinary URL
    const resumePublicId = req.file.filename;

    const parsed = await parseResumeFromUrl(resumeUrl);

    const name = req.body.name || parsed.name || "Unknown";
    const email = req.body.email || parsed.email || "";
    const phone = req.body.phone || parsed.phone || "";
    const tier = computeTier(parsed.experienceYears);

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      location: parsed.location,
      resumeUrl,
      resumePublicId,
      skills: parsed.skills,
      experienceYears: parsed.experienceYears,
      tier,
      source: "public-upload",
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Thanks! Your resume has been submitted for review.",
      candidate: { id: candidate._id, name: candidate.name, tier: candidate.tier },
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;