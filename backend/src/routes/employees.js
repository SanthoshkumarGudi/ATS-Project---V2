// backend/src/routes/employees.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Candidate = require("../models/Candidate");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { parseResumeFromUrl } = require("../utils/resumeParser");

// GET /api/employees — search/filter the internal directory
router.get("/", protect, async (req, res) => {
  try {
    const { q, skill, department, availability } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (availability) filter.availability = availability;
    if (skill) filter.skills = { $regex: skill, $options: "i" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { currentRole: { $regex: q, $options: "i" } },
        { skills: { $regex: q, $options: "i" } },
      ];
    }
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error("Employee list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/employees/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/employees — HR adds an existing employee manually (resume optional)
router.post("/", protect, upload.single("resume"), async (req, res) => {
  try {
    const { name, email, phone, department, currentRole, location, availability, notes } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    let skills = req.body.skills
      ? req.body.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    let experienceYears = req.body.experienceYears ? parseFloat(req.body.experienceYears) : 0;
    let resumeUrl, resumePublicId;

    if (req.file) {
      resumeUrl = req.file.path;
      resumePublicId = req.file.filename;
      const parsed = await parseResumeFromUrl(resumeUrl);
      if (skills.length === 0) skills = parsed.skills;
      if (!experienceYears) experienceYears = parsed.experienceYears;
    }

    const employee = await Employee.create({
      name, email, phone, department, currentRole, location,
      skills, experienceYears,
      availability: availability || "available",
      resumeUrl, resumePublicId, notes,
    });

    res.status(201).json({ message: "Employee added", employee });
  } catch (err) {
    console.error("Add employee error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/employees/from-candidate/:candidateId
// Converts a fully onboarded candidate into an Employee record (auto path).
router.post("/from-candidate/:candidateId", protect, async (req, res) => {
  try {
    const { department, currentRole } = req.body;
    if (!department || !currentRole) {
      return res.status(400).json({ message: "Department and Current Role are required" });
    }

    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    if (candidate.convertedToEmployee) {
      return res.status(400).json({
        message: "This candidate has already been added to the Internal Portal.",
        employeeId: candidate.employeeId,
      });
    }

    if (!candidate.onboarding?.documentsCollected || !candidate.onboarding?.onboardingDate) {
      return res.status(400).json({
        message: "Onboarding isn't complete yet — documents must be collected and an onboarding date set first.",
      });
    }

    const employee = await Employee.create({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      department,
      currentRole,
      skills: candidate.skills,
      experienceYears: candidate.experienceYears,
      availability: "available",
      resumeUrl: candidate.resumeUrl,
      resumePublicId: candidate.resumePublicId,
      sourceCandidate: candidate._id,
    });

    candidate.convertedToEmployee = true;
    candidate.employeeId = employee._id;
    candidate.status = "onboarding";
    await candidate.save();

    res.status(201).json({ message: "Employee record created", employee });
  } catch (err) {
    console.error("Candidate-to-employee conversion error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /api/employees/:id — update availability/skills/notes/etc.
router.patch("/:id", protect, async (req, res) => {
  try {
    const allowed = ["name", "email", "phone", "department", "currentRole", "location", "skills", "experienceYears", "availability", "notes"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee updated", employee });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/employees/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;