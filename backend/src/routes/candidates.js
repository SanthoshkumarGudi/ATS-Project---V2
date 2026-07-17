// backend/src/routes/candidates.js
const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");
const { protect } = require("../middleware/auth");
const { computeTier } = require("../utils/tier");
const Interview = require("../models/Interview");
const { computeNextRound, roundLabel } = require("../utils/interviewFlow");

// GET /api/candidates — search/filter the pool
router.get("/", protect, async (req, res) => {
  try {
    const { tier, status, skill, q } = req.query;
    const filter = {};
    if (tier) filter.tier = tier;
    if (status) filter.status = status;
    if (skill) filter.skills = { $regex: skill, $options: "i" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { skills: { $regex: q, $options: "i" } },
      ];
    }
    const candidates = await Candidate.find(filter).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    console.error("Candidate list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/candidates/:id/next-round — what round should be scheduled next, if any
router.get("/:id/next-round", protect, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const completed = await Interview.find({ candidate: req.params.id, status: "completed" }).sort({ scheduledAt: 1 });
    const next = computeNextRound(completed);

    res.json({
      next: next ? { roundType: next.roundType, roundNumber: next.roundNumber, label: roundLabel(next.roundType, next.roundNumber) } : null,
    });
  } catch (err) {
    console.error("Next-round lookup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/candidates/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/candidates/:id — manual override: status, tier, tags, experience
router.patch("/:id", protect, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const allowed = ["tier", "tags", "experienceYears", "name", "email", "phone"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) candidate[key] = req.body[key];
    }
    if (req.body.experienceYears !== undefined && req.body.tier === undefined) {
      candidate.tier = computeTier(req.body.experienceYears);
    }
    if (req.body.status !== undefined) {
      candidate.setStatus(req.body.status);
    }

    await candidate.save();
    res.json({ message: "Candidate updated", candidate });
  } catch (err) {
    console.error("Candidate update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/candidates/:id/offer — Offer & Pre-Onboarding checklist
router.patch("/:id/offer", protect, async (req, res) => {
  try {
    const { offerSentAt, offerAcceptedAt, documentsCollected, onboardingDate, status } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    if (offerSentAt !== undefined) candidate.onboarding.offerSentAt = offerSentAt;
    if (offerAcceptedAt !== undefined) candidate.onboarding.offerAcceptedAt = offerAcceptedAt;
    if (documentsCollected !== undefined) candidate.onboarding.documentsCollected = documentsCollected;
    if (onboardingDate !== undefined) candidate.onboarding.onboardingDate = onboardingDate;
    if (status !== undefined) candidate.setStatus(status);

    await candidate.save();
    res.json({ message: "Onboarding info updated", candidate });
  } catch (err) {
    console.error("Offer update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;