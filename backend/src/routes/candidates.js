// backend/src/routes/candidates.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Candidate = require("../models/Candidate");
const Interview = require("../models/Interview");
const { protect } = require("../middleware/auth");
const { computeTier } = require("../utils/tier");
const { computeNextRound, roundLabel } = require("../utils/interviewFlow");
const { sendInterviewEmail } = require("../utils/emailService");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const AVAILABILITY_TOKEN_VALID_DAYS = 14;

async function sendAvailabilityRequest(candidate) {
  const token = crypto.randomBytes(32).toString("hex");
  candidate.availability = candidate.availability || {};
  candidate.availability.token = token;
  candidate.availability.tokenExpires = new Date(Date.now() + AVAILABILITY_TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000);
  candidate.availability.requestedAt = new Date();
  await candidate.save();

  if (!candidate.email) {
    console.warn(`⚠️  No email on file for ${candidate.name} — availability request not sent.`);
    return;
  }

  const link = `${FRONTEND_URL}/availability/${token}`;
  await sendInterviewEmail(
    candidate.email,
    "You've been shortlisted — share your availability",
    `<h2>You've been shortlisted!</h2>
     <p>Please let us know your available interview time slots by clicking below:</p>
     <a href="${link}" target="_blank" style="background:#1f8f86;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Share My Availability</a>`,
  );
}

// GET /api/candidates — search/filter the pool
router.get("/", protect, async (req, res) => {
  try {
    const { tier, status, skill, q } = req.query;
    const filter = {};
    if (tier) filter.tier = tier;
    if (status) filter.status = status;
    if (skill) filter.skills = { $regex: skill, $options: "i" };

    const searchTerms = q ? q.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (searchTerms.length > 0) {
      const skillRegexes = searchTerms.map((term) => new RegExp(term, "i"));
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { skills: { $in: skillRegexes } },
      ];
    }

    let candidates = await Candidate.find(filter).sort({ createdAt: -1 }).lean();

    if (searchTerms.length > 0) {
      const lowerTerms = searchTerms.map((t) => t.toLowerCase());
      candidates = candidates
        .map((c) => {
          const candidateSkillsLower = (c.skills || []).map((s) => s.toLowerCase());
          const matchCount = lowerTerms.filter((term) =>
            candidateSkillsLower.some((cs) => cs.includes(term) || term.includes(cs))
          ).length;
          return { ...c, matchCount };
        })
        .sort((a, b) => b.matchCount - a.matchCount || new Date(b.createdAt) - new Date(a.createdAt));
    }

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

// GET /api/candidates/:id/next-round
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

// PATCH /api/candidates/:id — manual override: status, tier, tags, experience
// Automatically emails an availability request the moment status becomes "shortlisted".
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

    let justShortlisted = false;
    if (req.body.status !== undefined) {
      justShortlisted = req.body.status === "shortlisted" && candidate.status !== "shortlisted";
      candidate.setStatus(req.body.status);
    }

    await candidate.save();

    if (justShortlisted) {
      await sendAvailabilityRequest(candidate);
    }

    res.json({ message: "Candidate updated", candidate });
  } catch (err) {
    console.error("Candidate update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/candidates/:id/request-availability — manual (re)send, e.g. if the candidate lost the link
router.post("/:id/request-availability", protect, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    await sendAvailabilityRequest(candidate);
    res.json({ message: "Availability request sent." });
  } catch (err) {
    console.error("Resend availability request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/candidates/availability/:token — PUBLIC, no login
router.get("/availability/:token", async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ "availability.token": req.params.token });
    if (!candidate) return res.status(404).json({ message: "This link is invalid." });
    if (candidate.availability.tokenExpires && candidate.availability.tokenExpires < new Date()) {
      return res.status(400).json({ message: "This link has expired. Please ask the hiring team to resend it." });
    }
    res.json({
      name: candidate.name,
      alreadySubmitted: !!candidate.availability.submittedAt,
      existingSlots: candidate.availability.slots || [],
      existingNotes: candidate.availability.notes || "",
    });
  } catch (err) {
    console.error("Fetch availability form error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/candidates/availability/:token — PUBLIC, no login
router.post("/availability/:token", async (req, res) => {
  try {
    const { slots, notes } = req.body;
    if (!Array.isArray(slots) || slots.filter(Boolean).length === 0) {
      return res.status(400).json({ message: "Please provide at least one available time slot." });
    }

    const candidate = await Candidate.findOne({ "availability.token": req.params.token });
    if (!candidate) return res.status(404).json({ message: "This link is invalid." });
    if (candidate.availability.tokenExpires && candidate.availability.tokenExpires < new Date()) {
      return res.status(400).json({ message: "This link has expired. Please ask the hiring team to resend it." });
    }

    candidate.availability.slots = slots.filter(Boolean);
    candidate.availability.notes = notes || "";
    candidate.availability.submittedAt = new Date();
    await candidate.save();

    res.json({ message: "Thank you — your availability has been submitted." });
  } catch (err) {
    console.error("Submit availability error:", err);
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