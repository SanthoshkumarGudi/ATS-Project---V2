// backend/routes/interviews.js
const User = require("../models/User");
const { sendInterviewEmail } = require("../utils/emailService");
const express = require("express");
const router = express.Router();
const Interview = require("../models/Interview");
const Application = require("../models/Application");
const { protect, authorize } = require("../middleware/auth");

// Schedule Interview (HM/Admin only)
// routes/interviews.js - POST /
// ====================== SCHEDULE INTERVIEW WITH GOOGLE MEET ======================
router.post(
  "/",
  protect,
  authorize("hiring_manager", "admin"),
  async (req, res) => {
    const { applicationId, scheduledAt, interviewerId, round } = req.body;

    try {
      // 1. Fetch application and job details
      const app = await Application.findById(applicationId)
        .populate("job")
        .populate("candidate");

      if (!app) {
        return res.status(404).json({ message: "Application not found" });
      }

      // 2. Your existing round validation logic (keep it as it is)
      // Determine expected next round
      // Find all interviews for this application, sorted by round ascending
      console.log("applicationId for scheduling interview is ", applicationId);
      const existingInterviews = await Interview.find({
        application: applicationId,
      }).sort({ round: 1 }); // ascending: 1, 2, 3...

      // Determine the highest completed round
      let highestCompletedRound = 0;
      for (const intv of existingInterviews) {
        if (intv.status === "completed") {
          highestCompletedRound = Math.max(highestCompletedRound, intv.round);
        }
      }

      // Next round should be highest completed + 1
      const nextExpectedRound = highestCompletedRound + 1;

      // Validate the requested round
      if (round !== nextExpectedRound) {
        return res.status(400).json({
          message: `Invalid round. Please schedule round ${nextExpectedRound} next.`,
        });
      }

      // Prevent scheduling a round that's already scheduled (but not completed)
      const alreadyScheduled = await Interview.findOne({
        application: applicationId,
        round: nextExpectedRound,
        status: "scheduled",
      });

      if (alreadyScheduled) {
        return res.status(400).json({
          success: false,
          type: "ROUND_ALREADY_SCHEDULED",
          message: `Round ${nextExpectedRound} is already scheduled.`,
        });
      }

      // 3. Create Interview record
      const interview = new Interview({
        application: applicationId,
        scheduledAt: new Date(scheduledAt),
        interviewer: interviewerId,
        round,
      });
      await interview.save();

      // 4. Create Google Meet Event
      const { createGoogleMeetEvent } = require("../utils/googleMeetService");

      const startTime = new Date(scheduledAt).toISOString();
      const endTime = new Date(
        new Date(scheduledAt).getTime() + 60 * 60 * 1000,
      ).toISOString(); // 1 hour meeting

      const candidateEmail = app.candidate?.email || app.parsedData?.email;
      const interviewer = await User.findById(interviewerId);

      const { meetingLink } = await createGoogleMeetEvent({
        summary: `Interview: ${app.job.title} - Round ${round}`,
        description: `Interview for position: ${app.job.title}`,
        startTime,
        endTime,
      });

      // 5. Save meeting link to interview record
      interview.meetingLink = meetingLink;
      console.log("Saving interview with meeting link:", interview.meetingLink);
      await interview.save();

      // 6. Prepare Email Content
      const emailHTMLForCandidate = `
      <h2>Interview Scheduled</h2>
      <p><strong>Job Title:</strong> ${app.job.title}</p>
      <p><strong>Round:</strong> ${round}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <wrap>
      <a href="${meetingLink}" 
         target="_blank" 
         style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
        Join Google Meet
      </a>
      <p>Please join 5 minutes early. The meeting link is valid only for this interview.</p>
      <p>Best regards,<br><strong>HR Team, Prixgen Tech Solutions</strong></p>
      </wrap>
    `;

      const emailHTMLForInterviewer = `
      <h2>New Interview Scheduled</h2>
      <p><strong>Candidate:</strong> ${app.candidate?.name || app.parsedData?.name || "N/A"}</p>
      <p><strong>Job Title:</strong> ${app.job.title}</p>
      <p><strong>Round:</strong> ${round}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <wrap>
      <a href="${meetingLink}" 
         target="_blank" 
         style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
        View Google Meet Link
      </a>
      <p>Please join 5 minutes early. The meeting link is valid only for this interview.</p>
      <p>Best regards,<br><strong>HR Team, Prixgen Tech Solutions</strong></p>
      </wrap>
    `;

      // 7. Send emails
      if (candidateEmail) {
        await sendInterviewEmail(
          candidateEmail,
          `Interview Scheduled - ${app.job.title}`,
          emailHTMLForCandidate,
        );
      }
      if (interviewer?.email) {
        await sendInterviewEmail(
          interviewer.email,
          `You have an interview scheduled`,
          emailHTMLForInterviewer,
        );
      }

      res.status(201).json({
        success: true,
        message: "Interview scheduled successfully with Google Meet link",
        meetingLink: meetingLink,
      });
    } catch (err) {
      console.error("Interview scheduling error:", err);
      res.status(500).json({
        message: "Failed to schedule interview",
        error: err.message,
      });
    }
  },
);

// Update (reschedule) interview - HM/Admin only
router.put(
  "/reschedule",
  protect,
  authorize("hiring_manager", "admin"),
  async (req, res) => {
    try {
      const { applicationId, scheduledAt, interviewerId, round } = req.body;

      // Check if the application exists
      // 1. Fetch application and job details
      const application = await Application.findById(applicationId)
        .populate("job")
        .populate("candidate");

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if the interview exists
      const interview = await Interview.findOne({
        application: applicationId,
        round,
      });
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // //round validation logic (same as scheduling)
      // const existingInterviews = await Interview.find({
      //   application: applicationId,
      // }).sort({ round: 1 });

      // let highestCompletedRound = 0;
      // for (const intv of existingInterviews) {
      //   if (intv.status === "completed") {
      //     highestCompletedRound = Math.max(highestCompletedRound, intv.round);
      //   }
      // }

      // const nextExpectedRound = highestCompletedRound + 1;

      // if (round !== nextExpectedRound) {
      //   return res.status(400).json({
      //     message: `Invalid round. Please reschedule round ${nextExpectedRound} next.`,
      //   });
      // }

      // Update the interview details
      interview.scheduledAt = new Date(scheduledAt);
      interview.interviewer = interviewerId;
      await interview.save();

      //create new Google Meet link
      const { createGoogleMeetEvent } = require("../utils/googleMeetService");

      const startTime = new Date(scheduledAt).toISOString();
      const endTime = new Date(
        new Date(scheduledAt).getTime() + 60 * 60 * 1000,
      ).toISOString(); // 1 hour meeting

      const candidateEmail =
        application.candidate?.email || application.parsedData?.email;
      const interviewer = await User.findById(interviewerId);

      const { meetingLink } = await createGoogleMeetEvent({
        summary: `Rescheduled Interview: ${application.job.title} - Round ${round}`,
        description: `Rescheduled interview for position: ${application.job.title}`,
        startTime,
        endTime,
      });

      // Update meeting link in interview record
      interview.meetingLink = meetingLink;
      await interview.save();

      // Prepare Email Content
      const emailHTMLForCandidate = `
      <h2>Interview Scheduled for <p><strong> ${application.job.title}</strong></p></h2>
     
      <p><strong>Round:</strong> ${round}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <br>
      <a href="${meetingLink}" 
         target="_blank" 
         style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
        Join Google Meet
      </a>
      <p>Please join 5 minutes early. The meeting link is valid only for this interview.</p>
      <p>Best regards,<br><strong>HR Team, Prixgen Tech Solutions</strong></p>
    `;

      const emailHTMLForInterviewer = `
      <h2>New Interview Scheduled <p><strong>${application.job.title}</strong></p></h2>
      <p><strong>Candidate:</strong> ${application.candidate?.name || app.parsedData?.name || "N/A"}</p>
      <p><strong>Round:</strong> ${round}</p>
      <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-IN")}</p>
      <br>
      <a href="${meetingLink}" 
         target="_blank" 
         style="background:#34a853;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
        View Google Meet Link
      </a>
      <p>Please join 5 minutes early. The meeting link is valid only for this interview.</p>
      <p>Best regards,<br><strong>HR Team, Prixgen Tech Solutions</strong></p>
    `;

      // Send emails about rescheduling
      if (candidateEmail) {
        await sendInterviewEmail(
          candidateEmail,
          `Interview Rescheduled - ${application.job.title}`,
          emailHTMLForCandidate,
        );
      }
      if (interviewer?.email) {
        await sendInterviewEmail(
          interviewer.email,
          `Your interview has been rescheduled`,
          emailHTMLForInterviewer,
        );
      }

      res.json({ message: "Interview rescheduled successfully", interview });
    } catch (err) {
      console.error("Error rescheduling interview:", err);
      res.status(500).json({
        message: "Failed to reschedule interview",
        error: err.message,
      });
    }
  },
);

// routes/interviews.js - POST /:id/feedback
router.post("/:id/feedback", protect, async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { rating, notes, recommendation, negotiatedSalary, noticePeriod } =
      req.body;

    if (!recommendation) {
      return res.status(400).json({ message: "Recommendation is required" });
    }

    const interview = await Interview.findById(interviewId).populate({
      path: "application",
      populate: { path: "job" },
    });

    if (!interview)
      return res.status(404).json({ message: "Interview not found" });

    if (interview.interviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (interview.status === "completed") {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    // Mark interview as completed
    interview.status = "completed";
    interview.feedback = {
      rating,
      notes,
      recommendation,
      negotiatedSalary,
      noticePeriod,
      submittedBy: req.user.id,
      submittedAt: new Date(),
    };
    await interview.save();

    const app = interview.application;

    // Progress application based on recommendation and current round
    if (recommendation === "next-round") {
      if (interview.round === 1) {
        app.status = "second-round";
      } else if (interview.round === 2) {
        app.status = "final-round";
      }
      // If already in final-round, stay there or auto-schedule next if needed
    } else if (recommendation === "hire") {
      app.status = "offered"; // or 'hired' if you prefer
    } else if (recommendation === "reject") {
      app.status = "rejected";
    }
    // "hold" → no status change

    await app.save();

    res.json({
      message: "Feedback submitted and candidate progressed",
      interview,
      applicationStatus: app.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Get all interviews for a candidate (for interviewer dashboard)
router.get("/my-interviews", protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ interviewer: req.user.id })
      .populate("application", "resumeUrl")
      .populate({
        path: "application",
        populate: { path: "candidate", select: "name email" },
      })
      .populate({
        path: "application",
        populate: { path: "job", select: "title" },
      });

    res.json(interviews);
    console.log("interviews are ", interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET MY INTERVIEWS — Only for interviewer role
router.get("/my", protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ interviewer: req.user.id })
      .populate({
        path: "application",
        populate: [
          { path: "candidate", select: "name email" },
          { path: "job", select: "title" },
        ],
      })
      .sort({ scheduledAt: -1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET MY INTERVIEWS AS CANDIDATE
router.get("/candidate/my", protect, async (req, res) => {
  try {
    // Find applications belonging to this candidate
    console.log("inside fetching scheduled interview details");

    const applications = await Application.find({
      candidate: req.user.id,
    }).select("_id");

    const applicationIds = applications.map((app) => app._id);

    const interviews = await Interview.find({
      application: { $in: applicationIds },
    })
      .populate("interviewer", "name")
      .populate("application", null)
      .populate({
        path: "application",
        populate: { path: "job", select: "title" },
      })
      .sort({ scheduledAt: 1 });

    res.json(interviews);
    console.log("==>", interviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all users who can take interviews
router.get(
  "/interviewers",
  protect,
  authorize("hiring_manager", "admin"),
  async (req, res) => {
    try {
      console.log("inside interviews route backend test===");
      const users = await User.find({
        role: { $in: ["interviewer"] },
      }).select("name");

      res.json(users);
      console.log(users);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

// GET interview for a specific application
router.get(
  "/application/:applicationId",
  protect,
  authorize("admin", "hiring_manager", "candidate"),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      console.log("applicationID is ", applicationId);

      const interview = await Interview.find({
        application: req.params.applicationId,
      })
        .populate("interviewer", "name")
        .populate({
          path: "application",
          populate: { path: "job", select: "title" },
        });

      if (!interview) {
        return res.status(404).json({ message: "No interview found" });
      }

      // Security: Only candidate of this application can see
      const application = await Application.findById(req.params.applicationId);
      console.log("inside view details route", application);

      console.log("user id is ", req.user.id);

      // if (application.candidate.toString() !== req.user.id) {
      //   return res.status(403).json({ message: 'Not authorized' });
      // }

      res.json(interview);
      console.log("interview details are ==>>>>>>", interview);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get all rejected candidates (where feedback recommendation is "reject")
router.get(
  "/rejected",
  protect,
  authorize("hiring_manager", "admin"),
  async (req, res) => {
    try {
      console.log("Fetching rejected applications...");

      const rejectedInterviews = await Interview.find({
        "feedback.recommendation": { $regex: /^reject$/i }, // Matches "reject" or "Reject"
      })
        .populate({
          path: "application",
          populate: [
            { path: "candidate", select: "name email" },
            { path: "job", select: "title department" },
          ],
        })
        .populate("feedbackBy", "name") // optional: interviewer name
        .sort({ updatedAt: -1 })
        .lean(); // improves performance

      // Transform data to match what frontend expects
      const applications = rejectedInterviews.map((interview) => {
        const app = interview.application;
        return {
          _id: interview._id,
          candidate: {
            name: app?.parsedData?.name || app?.candidate?.name,
            email: app?.parsedData?.email || app?.candidate?.email,
          },
          job: {
            title: app?.job?.title || "Unknown Job",
            department: app?.job?.department || "N/A",
          },
          appliedAt: app?.createdAt || interview.createdAt,
          resumeUrl: app?.resumeUrl || "", // assuming resumeUrl is on application
          status: interview.status,
          feedback: interview.feedback, // optional: if you want to show notes/rating
        };
      });

      res.status(200).json(applications);
    } catch (err) {
      console.error("Error fetching rejected candidates:", err);
      res
        .status(500)
        .json({ message: "Server error while fetching rejected candidates" });
    }
  },
);

// Fetch all interviews (Admin/HM only) - for analytics dashboard
router.get("/", protect, authorize("admin", "hiring_manager"), async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate({
        path: "application",                    // Populate Application
        select: "job candidate parsedData status",   // Select what you need
        populate: [
          {
            path: "job",                        // Nested: Populate Job inside Application
            select: "title",                    // Only need job title
          },
        ]
      })
      .select("status scheduledAt feedback") // Select only necessary fields from Interview
      .populate("interviewer", "name email")
      .sort({ scheduledAt: -1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
