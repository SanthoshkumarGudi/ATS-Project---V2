// backend/src/utils/interviewFlow.js

// Legacy fallback sequence — used for any candidate with no interviewTemplate assigned
// (interviewTemplate === null), so pre-existing in-progress candidates keep working
// exactly as before, with no migration needed.
const FIXED_SEQUENCE = ["hr", "tech", "manager"];

const ROUND_LABELS = { hr: "HR Round", tech: "Technical Round", manager: "Manager Round" };

function roundLabel(roundType, roundNumber = 1) {
  const base = ROUND_LABELS[roundType] || roundType;
  console.log("inside interview flow======================>",ROUND_LABELS, ROUND_LABELS[roundType], base, roundType, roundNumber);
  return roundNumber > 1 ? `${base} ${roundNumber}` : base;
}

function sequenceLabel(sequence) {
  return sequence.map((r) => ROUND_LABELS[r] || r).join(" → ");
}

// Resolves which round sequence applies to a candidate: their assigned template's
// rounds if one is set, otherwise the legacy fixed sequence. Expects
// candidate.interviewTemplate to already be populated (or null/undefined).
function sequenceFor(candidate) {
  if (candidate?.interviewTemplate?.rounds?.length) {
    return candidate.interviewTemplate.rounds;
  }
  return FIXED_SEQUENCE;
}

function computeNextRound(completedInterviews, sequence = FIXED_SEQUENCE) {
  if (!sequence || sequence.length === 0) return null;

  if (!completedInterviews || completedInterviews.length === 0) {
    return { roundType: sequence[0], roundNumber: 1 };
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
    const idx = sequence.indexOf(last.roundType);
    if (idx === -1 || idx === sequence.length - 1) return null;
    return { roundType: sequence[idx + 1], roundNumber: 1 };
  }

  return null;
}

module.exports = { FIXED_SEQUENCE, ROUND_LABELS, roundLabel, sequenceLabel, sequenceFor, computeNextRound };