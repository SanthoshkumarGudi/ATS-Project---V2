// backend/src/routes/interviews.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const { protect } = require("../middleware/auth");
const { sendInterviewEmail } = require("../utils/emailService");
const { createGoogleMeetEvent } = require("../utils/googleMeetService");
const { FIXED_SEQUENCE, roundLabel, computeNextRound } = require("../utils/interviewFlow");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FEEDBACK_TOKEN_VALID_DAYS = 45;

function generateFeedbackToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ============================================================
// SCHEDULE INTERVIEW
// Round type/number is ALWAYS auto-computed from the candidate's interview
// history + the last round's feedback outcome — the frontend never has to
// know or send it. `roundType` in the body is only an escape hatch to
// manually resume after a "hold".
// ============================================================
router.post("/", protect, async (req, res) => {
  try {
    const { candidateId, scheduledAt, interviewerName, interviewerEmail, roundType: manualRoundType } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const completed = await Interview.find({ candidate: candidateId, status: "completed" }).sort({ scheduledAt: 1 });
    let next = computeNextRound(completed);

    // Manual override — e.g. HM decides to resume a candidate who was put "on hold"
    if (!next && manualRoundType) {
      const sameType = completed
        .filter((i) => i.roundType === manualRoundType)
        .sort((a, b) => (b.roundNumber || 1) - (a.roundNumber || 1));
      next = { roundType: manualRoundType, roundNumber: sameType.length ? (sameType[0].roundNumber || 1) + 1 : 1 };
    }

    if (!next) {
      return res.status(400).json({
        message: `${candidate.name} has no further round to schedule automatically — check whether they're rejected, on hold, or have completed all rounds (status: ${candidate.status}).`,
      });
    }

    const alreadyScheduled = await Interview.findOne({
      candidate: candidateId,
      roundType: next.roundType,
      roundNumber: next.roundNumber,
      status: "scheduled",
    });
    if (alreadyScheduled) {
      return res.status(400).json({
        success: false,
        type: "ROUND_ALREADY_SCHEDULED",
        message: `${roundLabel(next.roundType, next.roundNumber)} is already scheduled for this candidate.`,
      });
    }

    if (!interviewerEmail) {
      return res.status(400).json({
        message: "Interviewer email is required — feedback can only be submitted via the link sent to that email.",
      });
    }

    const feedbackToken = generateFeedbackToken();
    const feedbackTokenExpires = new Date(Date.now() + FEEDBACK_TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000);
    const label = roundLabel(next.roundType, next.roundNumber);

    const interview = new Interview({
      candidate: candidateId,
      roundType: next.roundType,
      roundNumber: next.roundNumber,
      scheduledAt: new Date(scheduledAt),
      interviewerName,
      interviewerEmail,
      feedbackToken,
      feedbackTokenExpires,
    });

    const startTime = new Date(scheduledAt).toISOString();
    const endTime = new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString();
    const { meetingLink } = await createGoogleMeetEvent({
      summary: `${label} - ${candidate.name}`,
      description: `${label} interview for candidate ${candidate.name}`,
      startTime,
      endTime,
    });
    interview.meetingLink = meetingLink;
    await interview.save();

    candidate.status = `${next.roundType}-round`;
    await candidate.save();

    const feedbackUrl = `${FRONTEND_URL}/interview-feedback/${feedbackToken}`;

    const emailHTMLForCandidate = `
      <h2>Interview Scheduled</h2>
      <p><strong>Round:</strong> ${label}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <a href="${meetingLink}" target="_blank" style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Join Google Meet</a>
      <p>Please join 5 minutes early.</p>
      <p>Best regards,<br><strong>Hiring Team</strong></p>
    `;
    const emailHTMLForInterviewer = `
      <h2>New Interview Scheduled</h2>
      <p><strong>Candidate:</strong> ${candidate.name}</p>
      <p><strong>Round:</strong> ${label}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <a href="${meetingLink}" target="_blank" style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Join Google Meet</a>
      <p style="margin-top:20px;">After the interview, please submit your feedback here — only you can access this link:</p>
      <a href="${feedbackUrl}" target="_blank" style="background:#2f80ed;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Submit Feedback</a>
    `;

    if (candidate.email) {
      await sendInterviewEmail(candidate.email, `Interview Scheduled - ${label}`, emailHTMLForCandidate);
    }
    await sendInterviewEmail(interviewerEmail, `Interview Scheduled — feedback link inside`, emailHTMLForInterviewer);

    res.status(201).json({
      success: true,
      message: `${label} scheduled successfully. A feedback link has been emailed to the interviewer.`,
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

    const label = roundLabel(interview.roundType, interview.roundNumber);
    const startTime = new Date(scheduledAt).toISOString();
    const endTime = new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString();
    const { meetingLink } = await createGoogleMeetEvent({
      summary: `Rescheduled: ${label} - ${interview.candidate.name}`,
      description: `Rescheduled interview`,
      startTime,
      endTime,
    });
    interview.meetingLink = meetingLink;
    await interview.save();

    const candidate = interview.candidate;
    const feedbackUrl = `${FRONTEND_URL}/interview-feedback/${interview.feedbackToken}`;
    const emailHTML = `
      <h2>Interview Rescheduled</h2>
      <p><strong>Round:</strong> ${label}</p>
      <p><strong>New Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <a href="${meetingLink}" target="_blank" style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Join Google Meet</a>
      <p style="margin-top:20px;">Your feedback link is unchanged: <a href="${feedbackUrl}">${feedbackUrl}</a></p>
    `;
    if (candidate?.email) {
      await sendInterviewEmail(candidate.email, `Interview Rescheduled - ${label}`, emailHTML);
    }
    if (interview.interviewerEmail) {
      await sendInterviewEmail(interview.interviewerEmail, `Interview Rescheduled`, emailHTML);
    }

    res.json({ message: "Interview rescheduled successfully", interview });
  } catch (err) {
    console.error("Error rescheduling interview:", err);
    res.status(500).json({ message: "Failed to reschedule interview", error: err.message });
  }
});

// ============================================================
// RESEND FEEDBACK LINK
// ============================================================
router.post("/:id/resend-feedback-link", protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate("candidate");
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (!interview.interviewerEmail) {
      return res.status(400).json({ message: "This interview has no interviewer email on file." });
    }
    if (interview.status === "completed") {
      return res.status(400).json({ message: "Feedback has already been submitted for this round." });
    }

    interview.feedbackToken = generateFeedbackToken();
    interview.feedbackTokenExpires = new Date(Date.now() + FEEDBACK_TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000);
    await interview.save();

    const label = roundLabel(interview.roundType, interview.roundNumber);
    const feedbackUrl = `${FRONTEND_URL}/interview-feedback/${interview.feedbackToken}`;
    await sendInterviewEmail(
      interview.interviewerEmail,
      `Reminder: Feedback needed for ${interview.candidate?.name}`,
      `<h2>Feedback Reminder</h2>
       <p>Please submit your feedback for <strong>${interview.candidate?.name}</strong>'s ${label}:</p>
       <a href="${feedbackUrl}" target="_blank" style="background:#2f80ed;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Submit Feedback</a>`,
    );

    res.json({ message: "Feedback link resent to the interviewer." });
  } catch (err) {
    console.error("Resend feedback link error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// PUBLIC: view interview + candidate for feedback form (token-scoped, no login)
// ============================================================
router.get("/feedback/:token", async (req, res) => {
  try {
    const interview = await Interview.findOne({ feedbackToken: req.params.token }).populate("candidate");
    if (!interview) return res.status(404).json({ message: "This feedback link is invalid." });
    if (interview.status === "completed") {
      return res.status(400).json({ message: "Feedback has already been submitted for this round." });
    }
    if (interview.feedbackTokenExpires && interview.feedbackTokenExpires < new Date()) {
      return res.status(400).json({ message: "This feedback link has expired. Ask the Hiring Manager to resend it." });
    }

    res.json({
      roundType: interview.roundType,
      roundNumber: interview.roundNumber,
      label: roundLabel(interview.roundType, interview.roundNumber),
      scheduledAt: interview.scheduledAt,
      interviewerName: interview.interviewerName,
      candidate: interview.candidate,
    });
  } catch (err) {
    console.error("Fetch feedback form error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// PUBLIC: submit feedback (token-scoped, no login)
// recommendation drives the next action:
//   proceed -> next stage in FIXED_SEQUENCE (or final-evaluation if this was the last stage)
//   repeat  -> same stage, candidate stays at "<type>-round" (a Round 2/3/... gets scheduled next)
//   reject  -> candidate.status = "rejected", process ends
//   hold    -> candidate.status = "on-hold", process paused
// ============================================================
router.post("/feedback/:token", async (req, res) => {
  try {
    const { rating, notes, recommendation, negotiatedSalary, noticePeriod } = req.body;
    if (!recommendation) return res.status(400).json({ message: "Recommendation is required" });

    const interview = await Interview.findOne({ feedbackToken: req.params.token }).populate("candidate");
    if (!interview) return res.status(404).json({ message: "This feedback link is invalid." });
    if (interview.status === "completed") {
      return res.status(400).json({ message: "Feedback has already been submitted for this round." });
    }
    if (interview.feedbackTokenExpires && interview.feedbackTokenExpires < new Date()) {
      return res.status(400).json({ message: "This feedback link has expired. Ask the Hiring Manager to resend it." });
    }

    interview.status = "completed";
    interview.feedback = { rating, notes, recommendation, negotiatedSalary, noticePeriod };
    interview.feedbackAt = new Date();
    interview.feedbackToken = undefined;
    interview.feedbackTokenExpires = undefined;
    await interview.save();

    const candidate = interview.candidate;
    if (recommendation === "reject") {
      candidate.status = "rejected";
    } else if (recommendation === "hold") {
      candidate.status = "on-hold";
    } else if (recommendation === "repeat") {
      candidate.status = `${interview.roundType}-round`;
    } else if (recommendation === "proceed") {
      const idx = FIXED_SEQUENCE.indexOf(interview.roundType);
      candidate.status = idx === FIXED_SEQUENCE.length - 1 ? "final-evaluation" : `${FIXED_SEQUENCE[idx + 1]}-round`;
    }
    await candidate.save();

    res.json({ message: "Thank you — your feedback has been submitted." });
  } catch (err) {
    console.error("Public feedback submission error:", err);
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
// GET rejected candidates
// ============================================================
router.get("/rejected", protect, async (req, res) => {
  try {
    const rejectedInterviews = await Interview.find({ "feedback.recommendation": "reject" })
      .populate("candidate", "name email tier skills")
      .sort({ updatedAt: -1 })
      .lean();

    const results = rejectedInterviews.map((interview) => ({
      _id: interview._id,
      candidate: interview.candidate,
      roundType: interview.roundType,
      roundNumber: interview.roundNumber,
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