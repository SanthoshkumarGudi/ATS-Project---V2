// backend/src/utils/availabilityService.js
const crypto = require("crypto");
const { sendInterviewEmail } = require("./emailService");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const AVAILABILITY_TOKEN_VALID_DAYS = 14;

// Generates a fresh availability token for the candidate and emails them the link.
// Called both when a candidate is first shortlisted, and again whenever a new
// round needs scheduling — each call clears out the previous round's answer so
// the candidate is always being asked for slots relevant to what's coming next.
async function requestAvailability(candidate, { roundLabel } = {}) {
  const token = crypto.randomBytes(32).toString("hex");
  candidate.availability = candidate.availability || {};
  candidate.availability.token = token;
  candidate.availability.tokenExpires = new Date(Date.now() + AVAILABILITY_TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000);
  candidate.availability.requestedAt = new Date();
  // Clear the previous round's answer — we need fresh slots for what's next.
  candidate.availability.submittedAt = undefined;
  candidate.availability.slots = [];
  candidate.availability.notes = "";
  await candidate.save();

  if (!candidate.email) {
    console.warn(`⚠️  No email on file for ${candidate.name} — availability request not sent.`);
    return { sent: false, reason: "no-email" };
  }

  const link = `${FRONTEND_URL}/availability/${token}`;
  const heading = roundLabel
    ? `Please share your availability for your ${roundLabel}`
    : "You've been shortlisted — share your availability";

  await sendInterviewEmail(
    candidate.email,
    heading,
    `<h2>${heading}</h2>
     <p>Please let us know your available interview time slots by clicking below:</p>
     <a href="${link}" target="_blank" style="background:#1f8f86;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Share My Availability</a>`,
  );

  return { sent: true };
}

module.exports = { requestAvailability, AVAILABILITY_TOKEN_VALID_DAYS };