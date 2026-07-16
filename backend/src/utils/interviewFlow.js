// backend/src/utils/interviewFlow.js

// Fixed sequence for every candidate, regardless of tier.
const FIXED_SEQUENCE = ["hr", "tech", "manager"];

const ROUND_LABELS = { hr: "HR Round", tech: "Technical Round", manager: "Manager Round" };

function roundLabel(roundType, roundNumber = 1) {
  const base = ROUND_LABELS[roundType] || roundType;
  return roundNumber > 1 ? `${base} ${roundNumber}` : base;
}

/**
 * Determines the next round to schedule, based on the most recent COMPLETED
 * interview's feedback recommendation — not just "which stages are done."
 *
 * @param {Array} completedInterviews - this candidate's completed interviews,
 *   sorted chronologically ascending (oldest first). Each needs roundType,
 *   roundNumber, and feedback.recommendation.
 * @returns {{roundType, roundNumber} | null} - null means no automatic next
 *   round (candidate was rejected, put on hold, or has finished every stage).
 */
function computeNextRound(completedInterviews) {
  if (!completedInterviews || completedInterviews.length === 0) {
    return { roundType: FIXED_SEQUENCE[0], roundNumber: 1 };
  }

  const last = completedInterviews[completedInterviews.length - 1];
  const recommendation = last.feedback?.recommendation;

  if (!recommendation || recommendation === "reject" || recommendation === "hold") {
    return null;
  }

  if (recommendation === "repeat") {
    return { roundType: last.roundType, roundNumber: (last.roundNumber || 1) + 1 };
  }

  if (recommendation === "proceed") {
    const idx = FIXED_SEQUENCE.indexOf(last.roundType);
    if (idx === -1 || idx === FIXED_SEQUENCE.length - 1) return null; // was the last stage — ready for final evaluation
    return { roundType: FIXED_SEQUENCE[idx + 1], roundNumber: 1 };
  }

  return null;
}

module.exports = { FIXED_SEQUENCE, ROUND_LABELS, roundLabel, computeNextRound };