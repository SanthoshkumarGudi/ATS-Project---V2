// backend/src/utils/tier.js

// Tier cutoffs (years of experience) — used for display/categorization only.
// Round sequencing is no longer tier-based — see utils/interviewFlow.js.
function computeTier(experienceYears) {
  const yrs = Number(experienceYears) || 0;
  if (yrs < 1) return "fresher";
  if (yrs < 4) return "mid";
  return "senior";
}

module.exports = { computeTier };
