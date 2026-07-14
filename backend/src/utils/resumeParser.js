// backend/src/utils/resumeParser.js
const pdf = require("pdf-parse-fixed");
const fs = require("fs").promises;
const axios = require("axios");
const { extractSkills } = require("./SkillExtractor");

// ---------- Section splitting (keyword-based, handles "HEADER: content on same line") ----------
const SECTION_KEYWORDS = {
  summary: ["career summary", "professional summary", "summary", "objective", "profile", "about me"],
  skills: ["technical skills", "core skills", "skills"],
  experience: [
    "work experience", "professional experience", "relevant experience", "career history",
    "employment history", "work history", "experience",
  ],
  internships: ["internship experience", "internships", "internship"],
  education: ["education"],
  projects: ["academic projects", "projects"],
  certifications: ["certifications & licenses", "certifications", "certificates", "licenses"],
};

function isAllCapsLine(line) {
  return line === line.toUpperCase() && /[A-Z]/.test(line);
}

function matchSectionHeader(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return null;
  const lower = trimmed.toLowerCase().replace(/[:•▪\-–—]+$/, "").trim();

  const allKeywords = Object.entries(SECTION_KEYWORDS).flatMap(([section, kws]) =>
    kws.map((kw) => ({ section, kw })),
  );
  allKeywords.sort((a, b) => b.kw.length - a.kw.length); // longest/most-specific first

  for (const { section, kw } of allKeywords) {
    if (lower === kw) return { section, remainder: "" };
    if (lower.startsWith(kw + ":")) {
      const idx = trimmed.toLowerCase().indexOf(":");
      return { section, remainder: trimmed.slice(idx + 1).trim() };
    }
  }
  return null;
}

function splitIntoSections(text) {
  const lines = text.split("\n");
  const sections = { other: [] };
  let current = "other";

  for (const raw of lines) {
    const line = raw.trim();
    const headerMatch = matchSectionHeader(line);
    if (headerMatch) {
      current = headerMatch.section;
      sections[current] = sections[current] || [];
      if (headerMatch.remainder) sections[current].push(headerMatch.remainder);
      continue;
    }
    sections[current] = sections[current] || [];
    sections[current].push(raw);
  }

  const result = {};
  for (const [key, arr] of Object.entries(sections)) {
    result[key] = arr.join("\n").trim();
  }
  return result;
}

// ---------- Explicit "X years experience" phrase ----------
function extractExplicitExperienceYears(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:relevant\s*|total\s*|professional\s*|work\s*)?experience/i,
    /experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
    /total\s*experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  return null;
}

// ---------- Fallback: sum date ranges from the Experience section ONLY (never Internships/Education) ----------
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function parseDateToken(token) {
  token = token.trim().toLowerCase();
  if (/present|current|till\s*date|ongoing|now/.test(token)) return new Date();
  let m = token.match(/([a-z]{3,9})[.,]?\s*(\d{4})/);
  if (m) {
    const month = MONTHS[m[1].slice(0, 3)];
    if (month !== undefined) return new Date(parseInt(m[2]), month, 1);
  }
  m = token.match(/^(\d{4})$/);
  if (m) return new Date(parseInt(m[1]), 0, 1);
  return null;
}

function estimateExperienceFromDateRanges(sourceText) {
  if (!sourceText) return 0;
  const rangePattern = /([a-zA-Z]{3,9}[.,]?\s*\d{4}|\d{4})\s*[-–—]{1,2}\s*(present|current|now|[a-zA-Z]{3,9}[.,]?\s*\d{4}|\d{4})/gi;
  let totalMonths = 0;
  const matches = [...sourceText.matchAll(rangePattern)];
  for (const match of matches) {
    const start = parseDateToken(match[1]);
    const end = parseDateToken(match[2]);
    if (start && end && end > start) {
      totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    }
  }
  return totalMonths > 0 ? Math.round((totalMonths / 12) * 10) / 10 : 0;
}

// ---------- Name / email / phone / location ----------
function extractFields(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  let phone = "";
  const phonePattern = /(\+?91|0)?[-.\s]?\d{10}\b|mobile[:\s]*\+?\d[\d\s\-()]{9,15}/gi;
  const phones = text.match(phonePattern) || [];
  for (const p of phones) {
    const num = p.replace(/[^0-9+]/g, "");
    if (num.length >= 10 && num.length <= 13) {
      phone = num.length === 10 ? "+91 " + num : num;
      break;
    }
  }

  // Name: allow single-letter middle initials ("Pratik P Patil"); reject ALL-CAPS lines (headers).
  //
  // NOTE on the regex: [a-zA-Z.]* (zero-or-more, any case) replaces an earlier [a-z]+ (one-or-more,
  // lowercase-only) which rejected bare middle initials like "P". Loosening it to "any case" meant an
  // ALL-CAPS header like "CAREER SUMMARY" would also match the shape check, so isAllCapsLine() below
  // is required alongside the regex to filter those back out.
  let name = "Unknown";
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 3 && line.length < 50 &&
      !matchSectionHeader(line) &&
      /^[A-Z][a-zA-Z.]*(?:\s+[A-Z][a-zA-Z.]*){0,4}$/.test(line) &&
      !/(experience|education|skill|github|linkedin|http|resume|summary)/i.test(line)
    )  {
      name = line.trim();
      break;
    }
  }

  // Location: split each line on "|" so a contact line like
  // "City, State | phone | email | LinkedIn | GitHub" doesn't get discarded wholesale
  const cities = ["bangalore", "bengaluru", "mumbai", "delhi", "pune", "chennai", "hyderabad", "kolkata", "noida", "gurgaon", "ahmedabad", "kochi", "coimbatore", "jaipur", "indore", "mysore", "trivandrum", "belagavi", "belgaum"];
  const states = ["karnataka", "maharashtra", "tamil nadu", "delhi", "gujarat", "kerala", "telangana", "uttar pradesh"];
  let location = "Not mentioned";
  outer: for (const line of lines) {
    const segments = line.split("|").map((s) => s.trim());
    for (const seg of segments) {
      const l = seg.toLowerCase();
      if (!seg || l.includes("github") || l.includes("linkedin") || l.includes("http") || l.includes("@") || /^\+?\d/.test(seg)) continue;
      if (cities.some((c) => l.includes(c)) || states.some((s) => l.includes(s)) || l.includes("india")) {
        location = seg.replace(/[:\-–—]/g, " ").trim();
        break outer;
      }
    }
  }

  return { name, email, phone, location };
}

// ---------- Main parse ----------
async function parseResumeBuffer(buffer) {
  try {
    const data = await pdf(buffer);
    const text = data.text;

    const { name, email, phone, location } = extractFields(text);
    const sections = splitIntoSections(text);

    const skillsSource = sections.skills && sections.skills.length > 15 ? sections.skills : text;
    const skills = extractSkills(skillsSource);

    let experienceYears = extractExplicitExperienceYears(text);
    if (experienceYears === null) {
      // Internships are intentionally excluded — only real Experience/Summary/Other sections count
      // toward experienceYears (and therefore toward tier).
      const experienceOnlyText = [sections.summary, sections.experience, sections.other]
        .filter(Boolean)
        .join("\n");
      experienceYears = estimateExperienceFromDateRanges(experienceOnlyText);
    }

    return {
      name, email, phone, location, skills, experienceYears,
      sections: {
        summary: sections.summary || "",
        experience: sections.experience || "",
        internships: sections.internships || "",
        education: sections.education || "",
        projects: sections.projects || "",
        certifications: sections.certifications || "",
      },
    };
  } catch (err) {
    console.error("Resume parse failed:", err);
    return {
      name: "Unknown", email: "", phone: "", location: "Not mentioned",
      skills: [], experienceYears: 0,
      sections: { summary: "", experience: "", internships: "", education: "", projects: "", certifications: "" },
    };
  }
}

async function parseResumeFromLocalPath(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  return parseResumeBuffer(dataBuffer);
}

async function parseResumeFromUrl(url) {
  const response = await axios({ url, method: "GET", responseType: "arraybuffer" });
  return parseResumeBuffer(Buffer.from(response.data));
}

module.exports = { parseResumeBuffer, parseResumeFromLocalPath, parseResumeFromUrl };