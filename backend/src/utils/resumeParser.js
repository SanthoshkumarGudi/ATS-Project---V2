// backend/src/utils/resumeParser.js
const pdf = require("pdf-parse-fixed");
const fs = require("fs").promises;
const axios = require("axios");
const { extractSkills } = require("./SkillExtractor");

// ---------- Experience-year extraction ----------
function extractExperienceYears(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:relevant\s*|total\s*|professional\s*|work\s*)?experience/i,
    /experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
    /total\s*experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  return 0; // default — HM can override manually if the resume didn't state it clearly
}

// ---------- Shared field extraction (name/email/phone/location) ----------
function extractFields(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  let phone = "";
  const phonePattern = /(\+?91|0)?[-.\s]?\d{10}\b|mobile[:\s]*\+?\d[\d\s\-\(\)]{9,15}/gi;
  const phones = text.match(phonePattern) || [];
  for (let p of phones) {
    const num = p.replace(/[^0-9+]/g, "");
    if (num.length >= 10 && num.length <= 13) {
      phone = num.length === 10 ? "+91 " + num : num;
      break;
    }
  }

  let name = "Unknown";
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 5 &&
      line.length < 50 &&
      /^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,4}$/.test(line) &&
      !/(experience|education|skill|github|linkedin|http|resume)/i.test(line)
    ) {
      name = line.trim();
      break;
    }
  }

  const cities = [
    "bangalore", "bengaluru", "mumbai", "delhi", "pune", "chennai",
    "hyderabad", "kolkata", "noida", "gurgaon", "ahmedabad", "kochi",
    "coimbatore", "jaipur", "indore", "mysore", "trivandrum",
  ];
  const states = [
    "karnataka", "maharashtra", "tamil nadu", "delhi", "gujarat",
    "kerala", "telangana", "uttar pradesh",
  ];
  let location = "Not mentioned";
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes("github") || l.includes("linkedin") || l.includes("http") || l.includes("@")) continue;
    if (cities.some((c) => l.includes(c)) || states.some((s) => l.includes(s)) || l.includes("india")) {
      location = line.replace(/[:\-–—]/g, " ").trim();
      break;
    }
  }

  return { name, email, phone, location };
}

async function parseResumeBuffer(buffer) {
  try {
    const data = await pdf(buffer);
    const text = data.text;

    const { name, email, phone, location } = extractFields(text);
    const skills = extractSkills(text);
    const experienceYears = extractExperienceYears(text);

    return { name, email, phone, location, skills, experienceYears };
  } catch (err) {
    console.error("Resume parse failed:", err);
    return { name: "Unknown", email: "", phone: "", location: "Not mentioned", skills: [], experienceYears: 0 };
  }
}

// Used for locally-saved files (rarely needed now that uploads go to Cloudinary)
async function parseResumeFromLocalPath(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  return parseResumeBuffer(dataBuffer);
}

// Used right after Cloudinary upload — fetch the file back and parse it
async function parseResumeFromUrl(url) {
  const response = await axios({ url, method: "GET", responseType: "arraybuffer" });
  return parseResumeBuffer(Buffer.from(response.data));
}

module.exports = { parseResumeBuffer, parseResumeFromLocalPath, parseResumeFromUrl };