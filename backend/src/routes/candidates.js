// backend/src/routes/candidates.js
const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");
const { protect } = require("../middleware/auth");
const { computeTier } = require("../utils/tier");

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
    const allowed = ["status", "tier", "tags", "experienceYears", "name", "email", "phone"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Recompute tier automatically if experience changed but tier wasn't set explicitly
    if (updates.experienceYears !== undefined && updates.tier === undefined) {
      updates.tier = computeTier(updates.experienceYears);
    }

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
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
    const update = {};
    if (offerSentAt !== undefined) update["onboarding.offerSentAt"] = offerSentAt;
    if (offerAcceptedAt !== undefined) update["onboarding.offerAcceptedAt"] = offerAcceptedAt;
    if (documentsCollected !== undefined) update["onboarding.documentsCollected"] = documentsCollected;
    if (onboardingDate !== undefined) update["onboarding.onboardingDate"] = onboardingDate;
    if (status !== undefined) update.status = status;

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    res.json({ message: "Onboarding info updated", candidate });
  } catch (err) {
    console.error("Offer update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;