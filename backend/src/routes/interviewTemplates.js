// backend/src/routes/interviewTemplates.js
const express = require("express");
const router = express.Router();
const InterviewTemplate = require("../models/InterviewTemplate");
const Candidate = require("../models/Candidate");
const { protect } = require("../middleware/auth");

const VALID_ROUNDS = ["hr", "tech", "manager"];
const TERMINAL_STATUSES = ["rejected", "hired", "offer-sent", "offer-accepted", "onboarding"];

router.get("/", protect, async (req, res) => {
  try {
    const templates = await InterviewTemplate.find().sort({ createdAt: 1 });
    res.json(templates);
  } catch (err) {
    console.error("List templates error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { name, rounds } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Template name is required" });
    if (!Array.isArray(rounds) || rounds.length === 0) {
      return res.status(400).json({ message: "Add at least one round." });
    }
    if (rounds.some((r) => !VALID_ROUNDS.includes(r))) {
      return res.status(400).json({ message: `Rounds must be one of: ${VALID_ROUNDS.join(", ")}` });
    }
    const template = await InterviewTemplate.create({ name: name.trim(), rounds });
    res.status(201).json({ message: "Template created", template });
  } catch (err) {
    console.error("Create template error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", protect, async (req, res) => {
  try {
    const { name, rounds } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: "Template name cannot be empty" });
      updates.name = name.trim();
    }
    if (rounds !== undefined) {
      if (!Array.isArray(rounds) || rounds.length === 0) {
        return res.status(400).json({ message: "Add at least one round." });
      }
      if (rounds.some((r) => !VALID_ROUNDS.includes(r))) {
        return res.status(400).json({ message: `Rounds must be one of: ${VALID_ROUNDS.join(", ")}` });
      }
      updates.rounds = rounds;
    }
    const template = await InterviewTemplate.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template updated", template });
  } catch (err) {
    console.error("Update template error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const inUseCount = await Candidate.countDocuments({
      interviewTemplate: req.params.id,
      status: { $nin: TERMINAL_STATUSES },
    });
    if (inUseCount > 0) {
      return res.status(400).json({
        message: `This template is assigned to ${inUseCount} candidate(s) still in progress — reassign them before deleting.`,
      });
    }
    const template = await InterviewTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template deleted" });
  } catch (err) {
    console.error("Delete template error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;