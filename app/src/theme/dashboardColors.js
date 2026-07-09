// src/theme/dashboardColors.js
export const colors = {
  bg: "#eef3f7",
  panel: "#ffffff",
  navy: "#16324a",
  navySoft: "#5c7280",
  tealDark: "#0f5b58",
  teal: "#1f8f86",
  tealMid: "#2fa79c",
  tealLight: "#a9d8d2",
  orange: "#f2994a",
  orangeBg: "#fde3cd",
  green: "#27ae60",
  greenBg: "#d9f2e2",
  blue: "#2f80ed",
  blueBg: "#dceafc",
  red: "#e05a5a",
  redBg: "#fbdede",
  purple: "#8e5cd9",
  purpleBg: "#f1e6fb",
  border: "#e3ebee",
};

export const tierColors = { fresher: colors.teal, mid: colors.orange, senior: colors.navy };

export const roundBadge = {
  tech: { bg: colors.blueBg, color: colors.blue, label: "Tech Round" },
  manager: { bg: colors.orangeBg, color: "#b3591b", label: "Manager Round" },
  hr: { bg: colors.greenBg, color: "#1b7a41", label: "HR Round" },
};

export const STATUS_META = {
  new: { label: "Screening", percent: 15, color: colors.navySoft, badgeBg: "#f1f5f7", badgeColor: colors.navySoft },
  shortlisted: { label: "Shortlisted", percent: 30, color: colors.tealMid, badgeBg: colors.tealLight, badgeColor: colors.tealDark },
  "tech-round": { label: "Interview", percent: 55, color: colors.blue, badgeBg: colors.blueBg, badgeColor: colors.blue },
  "manager-round": { label: "Interview", percent: 70, color: colors.orange, badgeBg: colors.orangeBg, badgeColor: "#b3591b" },
  "hr-round": { label: "Interview", percent: 85, color: colors.green, badgeBg: colors.greenBg, badgeColor: "#1b7a41" },
  "final-evaluation": { label: "Final Evaluation", percent: 95, color: colors.purple, badgeBg: colors.purpleBg, badgeColor: colors.purple },
  hired: { label: "Hired", percent: 100, color: colors.green, badgeBg: colors.greenBg, badgeColor: "#1b7a41" },
  "offer-sent": { label: "Offer & Pre-onboarding", percent: 100, color: colors.purple, badgeBg: colors.purpleBg, badgeColor: colors.purple },
  "offer-accepted": { label: "Offer & Pre-onboarding", percent: 100, color: colors.purple, badgeBg: colors.purpleBg, badgeColor: colors.purple },
  onboarding: { label: "Onboarding", percent: 100, color: colors.green, badgeBg: colors.greenBg, badgeColor: "#1b7a41" },
  rejected: { label: "Screening", percent: 40, color: colors.red, badgeBg: colors.redBg, badgeColor: colors.red },
  "on-hold": { label: "On Hold", percent: 50, color: colors.navySoft, badgeBg: "#f1f5f7", badgeColor: colors.navySoft },
};

const AVATAR_PALETTE = [colors.teal, colors.orange, colors.navy, colors.tealMid, colors.red, colors.purple, colors.blue];
export function avatarColorFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
export function initialsFor(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}