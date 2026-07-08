// backend/src/utils/tier.js

// Tier cutoffs (years of experience)
function computeTier(experienceYears) {
  const yrs = Number(experienceYears) || 0;
  if (yrs < 1) return "fresher";
  if (yrs < 4) return "mid";
  return "senior";
}

// Which round types apply to each tier, in order
function roundSequenceForTier(tier) {
  if (tier === "fresher") return ["tech", "hr"];
  // mid & senior get the same 3-round sequence by default
  return ["tech", "manager", "hr"];
}

// Given a tier and the round types already completed, return the next one
// (or null if the candidate has finished every round for their tier)
function nextRoundType(tier, completedRoundTypes = []) {
  const sequence = roundSequenceForTier(tier);
  for (const roundType of sequence) {
    if (!completedRoundTypes.includes(roundType)) return roundType;
  }
  return null;
}

const ROUND_LABELS = {
  tech: "Tech Round",
  manager: "Manager Round",
  hr: "HR Round",
};

module.exports = {
  computeTier,
  roundSequenceForTier,
  nextRoundType,
  ROUND_LABELS,
};