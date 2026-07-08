// backend/src/routes/interviews.js
const express = require("express");
const router = express.Router();
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const { protect } = require("../middleware/auth");
const { sendInterviewEmail } = require("../utils/emailService");
const { createGoogleMeetEvent } = require("../utils/googleMeetService");
const { nextRoundType, roundSequenceForTier, ROUND_LABELS } = require("../utils/tier");

// ============================================================
// SCHEDULE INTERVIEW  (auto-picks the next round type from tier
// unless roundType is explicitly passed)
// ============================================================
router.post("/", protect, async (req, res) => {
  try {
    const { candidateId, scheduledAt, interviewerName, interviewerEmail, roundType } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Figure out which round types are already completed for this candidate
    const completedInterviews = await Interview.find({
      candidate: candidateId,
      status: "completed",
    });
    const completedRoundTypes = completedInterviews.map((i) => i.roundType);

    const expectedRound = nextRoundType(candidate.tier, completedRoundTypes);
    if (!expectedRound) {
      return res.status(400).json({
        message: `${candidate.name} has already completed all rounds for the ${candidate.tier} tier.`,
      });
    }

    const finalRoundType = roundType || expectedRound;
    if (finalRoundType !== expectedRound) {
      return res.status(400).json({
        message: `Invalid round. Next expected round for this candidate is "${ROUND_LABELS[expectedRound]}".`,
      });
    }

    // Prevent double-scheduling the same round while one is already pending
    const alreadyScheduled = await Interview.findOne({
      candidate: candidateId,
      roundType: finalRoundType,
      status: "scheduled",
    });
    if (alreadyScheduled) {
      return res.status(400).json({
        success: false,
        type: "ROUND_ALREADY_SCHEDULED",
        message: `${ROUND_LABELS[finalRoundType]} is already scheduled for this candidate.`,
      });
    }

    const interview = new Interview({
      candidate: candidateId,
      roundType: finalRoundType,
      scheduledAt: new Date(scheduledAt),
      interviewerName,
      interviewerEmail,
    });

    // Google Meet link
    const startTime = new Date(scheduledAt).toISOString();
    const endTime = new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString();

    const { meetingLink } = await createGoogleMeetEvent({
      summary: `${ROUND_LABELS[finalRoundType]} - ${candidate.name}`,
      description: `${ROUND_LABELS[finalRoundType]} interview for candidate ${candidate.name}`,
      startTime,
      endTime,
    });
    interview.meetingLink = meetingLink;
    await interview.save();

    // Move candidate status forward to reflect this round
    candidate.status = `${finalRoundType}-round`;
    await candidate.save();

    // Emails
    const emailHTMLForCandidate = `
      <h2>Interview Scheduled</h2>
      <p><strong>Round:</strong> ${ROUND_LABELS[finalRoundType]}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <a href="${meetingLink}" target="_blank" style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Join Google Meet</a>
      <p>Please join 5 minutes early.</p>
      <p>Best regards,<br><strong>Hiring Team</strong></p>
    `;
    const emailHTMLForInterviewer = `
      <h2>New Interview Scheduled</h2>
      <p><strong>Candidate:</strong> ${candidate.name}</p>
      <p><strong>Round:</strong> ${ROUND_LABELS[finalRoundType]}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <a href="${meetingLink}" target="_blank" style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">View Google Meet Link</a>
    `;

    if (candidate.email) {
      await sendInterviewEmail(candidate.email, `Interview Scheduled - ${ROUND_LABELS[finalRoundType]}`, emailHTMLForCandidate);
    }
    if (interviewerEmail) {
      await sendInterviewEmail(interviewerEmail, `You have an interview scheduled`, emailHTMLForInterviewer);
    }

    res.status(201).json({
      success: true,
      message: `${ROUND_LABELS[finalRoundType]} scheduled successfully`,
      meetingLink,
      interview,
    });
  } catch (err) {
    console.error("Interview scheduling error:", err);
    res.status(500).json({ message: "Failed to schedule interview", error: err.message });
  }
});

// ============================================================
// RESCHEDULE
// ============================================================
router.put("/:id/reschedule", protect, async (req, res) => {
  try {
    const { scheduledAt, interviewerName, interviewerEmail } = req.body;

    const interview = await Interview.findById(req.params.id).populate("candidate");
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    interview.scheduledAt = new Date(scheduledAt);
    if (interviewerName) interview.interviewerName = interviewerName;
    if (interviewerEmail) interview.interviewerEmail = interviewerEmail;

    const startTime = new Date(scheduledAt).toISOString();
    const endTime = new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString();
    const { meetingLink } = await createGoogleMeetEvent({
      summary: `Rescheduled: ${ROUND_LABELS[interview.roundType]} - ${interview.candidate.name}`,
      description: `Rescheduled interview`,
      startTime,
      endTime,
    });
    interview.meetingLink = meetingLink;
    await interview.save();

    const candidate = interview.candidate;
    const emailHTML = `
      <h2>Interview Rescheduled</h2>
      <p><strong>Round:</strong> ${ROUND_LABELS[interview.roundType]}</p>
      <p><strong>New Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <a href="${meetingLink}" target="_blank" style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Join Google Meet</a>
    `;
    if (candidate?.email) {
      await sendInterviewEmail(candidate.email, `Interview Rescheduled - ${ROUND_LABELS[interview.roundType]}`, emailHTML);
    }

    res.json({ message: "Interview rescheduled successfully", interview });
  } catch (err) {
    console.error("Error rescheduling interview:", err);
    res.status(500).json({ message: "Failed to reschedule interview", error: err.message });
  }
});

// ============================================================
// SUBMIT FEEDBACK — auto-advances candidate status
// ============================================================
router.post("/:id/feedback", protect, async (req, res) => {
  try {
    const { rating, notes, recommendation, negotiatedSalary, noticePeriod } = req.body;
    if (!recommendation) {
      return res.status(400).json({ message: "Recommendation is required" });
    }

    const interview = await Interview.findById(req.params.id).populate("candidate");
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.status === "completed") {
      return res.status(400).json({ message: "Feedback already submitted for this round" });
    }

    interview.status = "completed";
    interview.feedback = { rating, notes, recommendation, negotiatedSalary, noticePeriod };
    interview.feedbackAt = new Date();
    await interview.save();

    const candidate = interview.candidate;

    if (recommendation === "reject") {
      candidate.status = "rejected";
    } else if (recommendation === "hold") {
      candidate.status = "on-hold";
    } else if (recommendation === "next-round" || recommendation === "hire") {
      const completedInterviews = await Interview.find({
        candidate: candidate._id,
        status: "completed",
      });
      const completedRoundTypes = completedInterviews.map((i) => i.roundType);
      const upcoming = nextRoundType(candidate.tier, completedRoundTypes);

      candidate.status = upcoming ? `${upcoming}-round` : "final-evaluation";
    }
    await candidate.save();

    res.json({
      message: "Feedback submitted and candidate progressed",
      interview,
      candidateStatus: candidate.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// GET all interviews for one candidate (timeline view)
// ============================================================
router.get("/candidate/:candidateId", protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ candidate: req.params.candidateId }).sort({ scheduledAt: 1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// GET rejected candidates (via interview feedback)
// ============================================================
router.get("/rejected", protect, async (req, res) => {
  try {
    const rejectedInterviews = await Interview.find({
      "feedback.recommendation": { $regex: /^reject$/i },
    })
      .populate("candidate", "name email tier skills")
      .sort({ updatedAt: -1 })
      .lean();

    const results = rejectedInterviews.map((interview) => ({
      _id: interview._id,
      candidate: interview.candidate,
      roundType: interview.roundType,
      scheduledAt: interview.scheduledAt,
      feedback: interview.feedback,
    }));

    res.json(results);
  } catch (err) {
    console.error("Error fetching rejected candidates:", err);
    res.status(500).json({ message: "Server error while fetching rejected candidates" });
  }
});

// ============================================================
// GET all interviews (analytics dashboard)
// ============================================================
router.get("/", protect, async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate("candidate", "name email tier status")
      .sort({ scheduledAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;