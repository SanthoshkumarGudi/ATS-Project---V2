// src/components/TierBadge.jsx
import { Chip } from "@mui/material";

const TIER_STYLES = {
  fresher: { label: "Fresher", bg: "#e0f2fe", color: "#0369a1" },
  mid: { label: "Mid", bg: "#ede9fe", color: "#6d28d9" },
  senior: { label: "Senior", bg: "#dcfce7", color: "#15803d" },
};

export default function TierBadge({ tier }) {
  const style = TIER_STYLES[tier] || TIER_STYLES.fresher;
  return (
    <Chip
      size="small"
      label={style.label}
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600 }}
    />
  );
}
