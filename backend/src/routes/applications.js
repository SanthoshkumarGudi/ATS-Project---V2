// backend/src/routes/applications.js
const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Job = require("../models/Job");
const CandidateProfile = require("../models/CandidateProfile");
const upload = require("../middleware/upload"); // Cloudinary upload
const { protect, authorize } = require("../middleware/auth");
const axios = require("axios");
//fixing

const pdfParse = require("pdf-parse-fixed");

// ==================================================================
// BEST RESUME PARSER — FROM CLOUDINARY URL (NO LOCAL FILE NEEDED)
// ==================================================================

// --- helper functions (outside parseResumeFromUrl) ---
function normalizeToken(token) {
  return token.toLowerCase().replace(/\./g, "").trim();
}

const SKILL_LIST = [
  "java",
  "javascript",
  "nodejs",
  "python",
  "reactjs",
  "typescript",
  "html",
  "html5",
  "css",
  "css3",
  "material ui",
  "spring boot",
  "restful apis",
  "mysql",
  "mongodb",
  "selenium",
  "cypress",
  "git",
  "jira",
  "agile",
  "testing",
  "manual testing",
  "automation testing",
];

// NORMALIZE TEXT (VERY IMPORTANT)
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // remove symbols
    .replace(/\s+/g, " ") // remove extra spaces
    .trim();
}

// Fuzzy similarity (Jaro-Winkler)
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  let m = 0;

  // Max distance between two chars to be matched
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;

  const aMatch = new Array(a.length);
  const bMatch = new Array(b.length);

  // Count matches
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);

    for (let j = start; j < end; j++) {
      if (a[i] === b[j] && !bMatch[j]) {
        aMatch[i] = true;
        bMatch[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  // Count transpositions
  let t = 0;
  let k = 0;

  for (let i = 0; i < a.length; i++) {
    if (aMatch[i]) {
      while (!bMatch[k]) k++;
      if (a[i] !== b[k]) t++;
      k++;
    }
  }

  t = t / 2;

  const jaro = (m / a.length + m / b.length + (m - t) / m) / 3;

  // Apply Jaro-Winkler bonus
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

// Check if similarity ≥ 80%
function fuzzyMatch(a, b) {
  return similarity(a, b) >= 0.8;
}

function extractSkills(lines) {
  const fullText = normalize(lines.join(" ")); // whole resume text
  const found = new Set();

  for (const skill of SKILL_LIST) {
    const normalizedSkill = normalize(skill);

    if (fullText.includes(normalizedSkill)) {
      found.add(normalizedSkill);
    }
  }

  console.log("skills ", found);

  return Array.from(found);
}

async function parseResumeFromUrl(url) {
  try {
    console.log("Parsing resume from Cloudinary URL:", url);

    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
      // timeout: 20000
    });

    const buffer = Buffer.from(response.data);

    // TEST PDF HEADER
    console.log("HEADER:", buffer.toString("utf8", 0, 8));

    const data = await pdfParse(response.data);
    const text = data.text;
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const lower = text.toLowerCase();

    // EMAIL
    const email =
      (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] ||
      "";

    // PHONE
    let phone = "";
    const phones =
      text.match(
        /(\+?91|0)?[-.\s]?\d{10}\b|mobile[:\s]*\+?\d[\d\s\-\(\)]{9,15}/gi,
      ) || [];
    for (let p of phones) {
      const num = p.replace(/[^0-9+]/g, "");
      if (num.length >= 10 && num.length <= 13) {
        phone = num.length === 10 ? "+91 " + num : num;
        break;
      }
    }

    //NAME
    const name = extractName(lines);

    // ----------------- SKILLS -----------------
    const skills = extractSkills(lines);

    // LOCATION
    const cities = [
      "bangalore",
      "bengaluru",
      "mumbai",
      "delhi",
      "pune",
      "chennai",
      "hyderabad",
      "kolkata",
      "noida",
      "gurgaon",
      "ahmedabad",
      "kochi",
      "coimbatore",
      "jaipur",
      "indore",
    ];
    const states = [
      "karnataka",
      "maharashtra",
      "tamil nadu",
      "delhi",
      "gujarat",
      "kerala",
      "telangana",
    ];
    let location = "Not mentioned";
    for (const line of lines) {
      const l = line.toLowerCase();
      if (
        l.includes("github") ||
        l.includes("linkedin") ||
        l.includes("http") ||
        l.includes("@")
      )
        continue;
      if (
        cities.some((c) => l.includes(c)) ||
        states.some((s) => l.includes(s)) ||
        l.includes("india")
      ) {
        location = line.replace(/[:\-–—]/g, " ").trim();
        break;
      }
    }

    // function extractSkills(lines) {
    //   const found = new Set();
    //   for (const line of lines) {
    //     if (/skills?|technical|technologies/i.test(line)) {
    //       const tokens = line.split(/[\s,•|\/\-\–\—]+/);
    //       for (const token of tokens) {
    //         const normalized = normalizeToken(token);
    //         for (const [skill, variants] of Object.entries(skillVariants)) {
    //          if (variants.some(v => normalized.includes(v))){
    //             found.add(skill.charAt(0).toUpperCase() + skill.slice(1));
    //           }
    //         }
    //       }
    //     }
    //   }
    //   return Array.from(found);
    // }

    //NAME
    function extractName(lines) {
      const nameRegex = /^[A-Z][a-zA-Z]{1,20}(?:\s+[A-Z][a-zA-Z]{1,20}){0,3}$/;
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (
          line.length < 3 ||
          line.length > 60 ||
          /[@0-9]/.test(line) ||
          /(skill|experience|education|project|summary|profile|developer|engineer|linkedin|github|http)/i.test(
            line,
          )
        )
          continue;
        if (nameRegex.test(line)) return line;
      }
      const first = lines[0]?.trim();
      if (first && /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(first)) return first;
      return "Unknown";
    }

    return {
      name: name.trim(),
      email,
      phone: phone || "",
      location,
      skills,
    };
  } catch (err) {
    console.error("Parse failed:", err.message);
    return {
      name: "Unknown",
      email: "",
      phone: "",
      location: "Not mentioned",
      skills: [],
    };
  }
}

// ==================================================================
// 1. APPLY TO JOB + PARSE RESUME + SAVE PARSED DATA
// ==================================================================
router.post("/:jobId", protect, upload.single("resume"), async (req, res) => {
  try {
    console.log("cover letter is", req.body.coverLetter);
    if (!req.file)
      return res.status(400).json({ message: "Resume is required" });

    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== "published") {
      return res.status(404).json({ message: "Job not found or closed" });
    }

    const alreadyApplied = await Application.findOne({
      job: req.params.jobId,
      candidate: req.user.id,
    });
    if (alreadyApplied)
      return res.status(400).json({ message: "Already applied" });

    const candidateProfile = await CandidateProfile.findOne({
      user: req.user.id,
    });
    if (!candidateProfile) {
      return res.status(400).json({
        message: "Please complete your candidate profile first before applying",
      });
    }

    const resumeUrl = req.file.path; // Cloudinary URL

    // Parse resume from Cloudinary
    const parsed = await parseResumeFromUrl(resumeUrl);

    const candidateSkills = parsed.skills;
    const jobSkills = job.skills.map((s) => normalize(s));
    console.log("Job Skills are*******************************", jobSkills);
    console.log("Candidate Skills are*************************", candidateSkills);
    // const matched = jobSkills.filter(s => candidateSkills.includes(s)); // it does the strict matching
    const matched = [];

    for (const jobSkill of jobSkills) {
      for (const candSkill of candidateSkills) {
        if (fuzzyMatch(jobSkill, candSkill)) {
          matched.push(jobSkill);
          break;
        }
      }
    }

    const missing = jobSkills.filter((s) => !matched.includes(s));

    // === NEW: Handle screening answers ===
    let screeningAnswers = [];
    if (req.body.screeningAnswers) {
      try {
        screeningAnswers = JSON.parse(req.body.screeningAnswers);
      } catch (err) {
        return res
          .status(400)
          .json({ message: "Invalid screening answers format" });
      }
    }

    const matchPercentage =
      jobSkills.length > 0
        ? Math.round((matched.length / jobSkills.length) * 100)
        : 0;
    const isShortlisted = matchPercentage >= 70;

    console.log(req.user.name);
    console.log(req.user.email);

    const application = await Application.create({
      //this is object literal it accepts only object liter
      job: req.params.jobId,
      candidate: req.user.id,
      candidateprofile: candidateProfile._id, // ← CORRECT: Use CandidateProfile ID
      resumeUrl,
      resumePublicId: req.file.filename,
      parsedData: {
        name: parsed.name || req.user.name,
        // name: req.user.name,

        email: parsed.email || req.user.email,
        phone: parsed.phone,
        location: parsed.location,
        skills: parsed.skills,
        matchedSkills: matched.map(
          (s) => s.charAt(0).toUpperCase() + s.slice(1),
        ),
        missingSkills: missing.map(
          (s) => s.charAt(0).toUpperCase() + s.slice(1),
        ),
        matchPercentage,
        isShortlisted,
      },
      coverLetter: req.body.coverLetter,
      expectedSalary: req.body.expectedSalary,
      availability: req.body.availability,
      // NEW: Save screening answers
      screeningAnswers,
    });

    await application.populate("job", "title department location");

    res.status(201).json({
      success: true,
      message: "Applied successfully!",
      matchPercentage,
      isShortlisted,
      application,
    });
    console.log("is Shortlisted**********", isShortlisted)
  } catch (err) {
    console.error("Apply error:", err);
    console.log("error *7* is ", err);

    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================================================================
// 2. GET CANDIDATE'S APPLICATIONS
// ==================================================================
router.get("/my", protect, async (req, res) => {
  try {
    console.log("inside /my root");

    const apps = await Application.find({ candidate: req.user.id })
      .populate("job", "title department location status")
      .sort({ appliedAt: -1 });
    res.json(apps);
    console.log("applied jobs are ", apps);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ==================================================================
// 3. GET ALL APPLICANTS FOR A JOB (HM/Admin Dashboard)
// ==================================================================
router.get(
  "/job/:jobId",
  protect,
  authorize("admin", "hiring_manager"),
  async (req, res) => {
    try {
      console.log("inside getting applications");

      const applications = await Application.find({ job: req.params.jobId })
        .populate("candidate", "name email")
        .populate("job", "title skills")
        .populate("candidateprofile", "image experience") // populate candidate profile details
        .sort({ appliedAt: -1 });
      // console.log("candidate application details are ", apps);
      res.json(applications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// GET /api/applications/all-dashboard - For HM/Admin dashboard stats only
router.get(
  "/all-dashboard",
  protect,
  authorize("admin", "hiring_manager"),
  async (req, res) => {
    try {
      const applications = await Application.find({})
        .populate("job", "_id title") // only need job ID and title if you want
        .select("job status parsedData.isShortlisted")
        .lean();

      res.json(applications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get the all the candidates who applied for a job - For HM/Admin dashboard stats only
router.get(
  "/candidates-dashboard",
  protect,
  authorize("admin", "hiring_manager"),
  async (req, res) => {
    try {
      const applications = await Application.find({})
        .populate("candidate", "name email experience") // only need candidate name and email
        .populate("candidateprofile", "image") // populate candidate profile details
        .populate("job", "title department") // only need job title
        .select(
          `candidate candidateprofile job parsedData.name parsedData.email parsedData.phone parsedData.location appliedAt status`,
        )
        .lean();

      res.json(applications);
      console.log("candidate application details are ", applications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
