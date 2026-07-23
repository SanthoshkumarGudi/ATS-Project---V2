// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Grid, Stack } from "@mui/material";
import {
  FileText,
  Users2,
  Star,
  CalendarCheck,
  Briefcase,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import axios from "../utils/api";
import {
  colors,
  roundBadge,
  STATUS_META,
  avatarColorFor,
  initialsFor,
} from "../theme/dashboardColors";

// ---------- small building blocks ----------
function Kpi({ icon: Icon, iconBg, val, label }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#fff",
        borderRadius: "18px",
        boxShadow:
          "0 8px 22px rgba(16,40,60,.08), 0 2px 6px rgba(16,40,60,.05)",
        p: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          bgcolor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} />
      </Box>
      <Typography sx={{ fontSize: 26, fontWeight: 900, color: colors.navy }}>
        {val}
      </Typography>
      <Typography
        sx={{ fontSize: 11.5, color: colors.navySoft, fontWeight: 700 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function Panel({ title, desc, children, sx }) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        borderRadius: "18px",
        boxShadow:
          "0 8px 22px rgba(16,40,60,.08), 0 2px 6px rgba(16,40,60,.05)",
        p: "22px 24px",
        ...sx,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: colors.navy }}>
          {title}
        </Typography>
        {desc && (
          <Typography
            sx={{
              fontSize: 11.5,
              color: colors.navySoft,
              fontWeight: 600,
              mt: 0.25,
            }}
          >
            {desc}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get("/candidates"),
      axios.get("/interviews"),
      axios.get("/employees"),
    ])
      .then(([c, i, e]) => {
        setCandidates(c.data);
        setInterviews(i.data);
        setEmployees(e.data);
        setLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setLoaded(true);
      });
  }, []);

  if (!loaded) return null;

  const total = candidates.length;
  const shortlisted = candidates.filter((c) => c.status !== "new").length;
  const scheduledInterviews = interviews.filter(
    (i) => i.status === "scheduled",
  ).length;
  const offersExtended = candidates.filter(
    (c) => c.onboarding?.offerSentAt,
  ).length;
  const hired = candidates.filter(
    (c) =>
      c.status === "hired" ||
      c.onboarding?.offerAcceptedAt ||
      c.convertedToEmployee,
  ).length;

  // Funnel
  const candidatesInterviewed = new Set(
    interviews.map((i) => i.candidate?._id || i.candidate),
  ).size;
  const funnelSteps = [
    { label: "Resumes in Repository", value: total, color: colors.tealDark },
    { label: "Shortlisted by HR", value: shortlisted, color: colors.tealMid },
    {
      label: "Interview Scheduled",
      value: candidatesInterviewed,
      color: colors.blue,
    },
    { label: "Offer Extended", value: offersExtended, color: colors.orange },
    { label: "Hired", value: hired, color: colors.green },
  ];
  const funnelMax = Math.max(total, 1);

  // Tier donut
  const tierCounts = {
    fresher: candidates.filter((c) => c.tier === "fresher").length,
    mid: candidates.filter((c) => c.tier === "mid").length,
    senior: candidates.filter((c) => c.tier === "senior").length,
  };
  const tierTotal = Math.max(
    tierCounts.fresher + tierCounts.mid + tierCounts.senior,
    1,
  );
  const tierPct = {
    fresher: Math.round((tierCounts.fresher / tierTotal) * 100),
    mid: Math.round((tierCounts.mid / tierTotal) * 100),
    senior: Math.round((tierCounts.senior / tierTotal) * 100),
  };
  const conicGradient = `conic-gradient(${colors.teal} 0% ${tierPct.fresher}%, ${colors.orange} ${tierPct.fresher}% ${tierPct.fresher + tierPct.mid}%, ${colors.navy} ${tierPct.fresher + tierPct.mid}% 100%)`;
  // Top skills in the pool
  const skillCounts = {};
  candidates.forEach((c) =>
    (c.skills || []).forEach((s) => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    }),
  );
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Upcoming interviews
  const upcoming = interviews
    .filter((i) => i.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 4);

  // Recent candidates
  const recent = [...candidates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <Box
      sx={{
        p: "30px 32px 60px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* KPI ROW */}
      <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
        <Kpi
          icon={FileText}
          iconBg={colors.tealLight}
          val={total}
          label="Resumes in Repository"
        />
        <Kpi
          icon={Star}
          iconBg={colors.orangeBg}
          val={shortlisted}
          label="Shortlisted"
        />
        <Kpi
          icon={CalendarCheck}
          iconBg={colors.greenBg}
          val={scheduledInterviews}
          label="Interviews Scheduled"
        />
        <Kpi
          icon={Briefcase}
          iconBg={colors.purpleBg}
          val={offersExtended}
          label="Offers Extended"
        />
        <Kpi
          icon={CheckCircle2}
          iconBg={colors.greenBg}
          val={hired}
          label="Hired"
        />
        <Kpi
          icon={Users2}
          iconBg={colors.blueBg}
          val={employees.length}
          label="Internal Portal Employees"
        />
      </Stack>

      {/* FUNNEL + DONUT */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Panel
          title="Candidate Pipeline Funnel"
          desc="Resumes are sourced from the repository — there is no application step"
          sx={{ flex: 1.6 }}
        >
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {funnelSteps.map((s) => (
              <Stack
                key={s.label}
                direction="row"
                alignItems="center"
                spacing={1.75}
              >
                <Typography
                  sx={{
                    width: 170,
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.navy,
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: "#f1f5f7",
                    borderRadius: "8px",
                    height: 26,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: "8px",
                      bgcolor: s.color,
                      width: `${Math.max((s.value / funnelMax) * 100, s.value > 0 ? 6 : 0)}%`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      pr: 1.25,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {s.value}
                  </Box>
                </Box>
                <Typography
                  sx={{
                    width: 48,
                    textAlign: "right",
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.navySoft,
                  }}
                >
                  {Math.round((s.value / funnelMax) * 100)}%
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Panel>

        <Panel
          title="Candidate Tier Breakdown"
          desc="Active pipeline by experience level"
          sx={{ flex: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={3} sx={{ mt: 1 }}>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: conicGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  bgcolor: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{ fontSize: 20, fontWeight: 900, color: colors.navy }}
                >
                  {tierCounts.fresher + tierCounts.mid + tierCounts.senior}
                </Typography>
                <Typography sx={{ fontSize: 10, color: colors.navySoft }}>
                  Total
                </Typography>
              </Box>
            </Box>
            <Stack spacing={1.5}>
              {[
                {
                  label: "Fresher",
                  count: tierCounts.fresher,
                  pct: tierPct.fresher,
                  color: colors.teal,
                },
                {
                  label: "Mid",
                  count: tierCounts.mid,
                  pct: tierPct.mid,
                  color: colors.orange,
                },
                {
                  label: "Senior",
                  count: tierCounts.senior,
                  pct: tierPct.senior,
                  color: colors.navy,
                },
              ].map((t) => (
                <Stack
                  key={t.label}
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "4px",
                      bgcolor: t.color,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 800, color: colors.navy }}
                    >
                      {t.label} — {t.count}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: colors.navySoft,
                        fontWeight: 600,
                      }}
                    >
                      {t.pct}% of pipeline
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Panel>
      </Stack>

      {/* TOP SKILLS + UPCOMING INTERVIEWS */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Panel
          title="Top Skills in Talent Pool"
          desc="Most common skills across the resume repository"
          sx={{ flex: 0.65 }}
        >
          <Stack spacing={1.25} sx={{ mt: 0.5 }}>
            {topSkills.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                No skills extracted yet.
              </Typography>
            ) : (
              topSkills.map(([skill, count]) => (
                <Stack
                  key={skill}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    p: "12px 14px",
                    bgcolor: "#f8fbfb",
                    borderRadius: "12px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: colors.tealLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Star size={16} color={colors.tealDark} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: colors.navy,
                      flex: 1,
                    }}
                  >
                    {skill}
                  </Typography>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 800, color: colors.navy }}
                    >
                      {count}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: colors.navySoft,
                        fontWeight: 600,
                      }}
                    >
                      candidates
                    </Typography>
                  </Box>
                </Stack>
              ))
            )}
          </Stack>
        </Panel>

        <Panel
          title="Upcoming Interviews"
          desc="Click a candidate to view round-by-round detail"
          sx={{ flex: 1 }}
        >
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {upcoming.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                Nothing scheduled right now.
              </Typography>
            ) : (
              upcoming.map((iv) => {
                const c = iv.candidate || {};
                const badge = roundBadge[iv.roundType] || roundBadge.tech;
                return (
                  <Stack
                    key={iv._id}
                    direction="row"
                    alignItems="center"
                    spacing={1.75}
                    onClick={() => navigate(`/candidate/${c._id}`)}
                    sx={{
                      p: "12px 14px",
                      bgcolor: "#f8fbfb",
                      borderRadius: "12px",
                      border: `1px solid ${colors.border}`,
                      cursor: "pointer",
                      transition: "0.15s",
                      "&:hover": {
                        bgcolor: "#eef6f6",
                        borderColor: colors.tealLight,
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        bgcolor: avatarColorFor(c.name),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 12,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {initialsFor(c.name)}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: colors.navy,
                        }}
                        noWrap
                      >
                        {c.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: colors.navySoft,
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                        noWrap
                      >
                        {c.tier} tier
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        ml: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          px: 1.1,
                          py: 0.4,
                          borderRadius: "7px",
                          bgcolor: badge.bg,
                          color: badge.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {badge.label}
                      </Box>
                      <Typography
                        sx={{
                          width: 110,
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 800,
                          color: colors.navy,
                        }}
                      >
                        {new Date(iv.scheduledAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Typography>
                      <ChevronRight size={16} color="#b9c8d2" />
                    </Box>
                  </Stack>
                );
              })
            )}
          </Stack>
        </Panel>
      </Stack>

      {/* RECENT CANDIDATES TABLE */}
      <Panel
        title="Recent Candidates"
        desc="Latest resumes moving through the pipeline · click a row to open the candidate"
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse", mt: 1 }}
          >
            <Box component="thead">
              <Box component="tr">
                {["Candidate", "Tier", "Stage", "Status", "Sourced Date"].map(
                  (h) => (
                    <Box
                      key={h}
                      component="th"
                      sx={{
                        textAlign: "left",
                        fontSize: 10.5,
                        color: colors.navySoft,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        fontWeight: 800,
                        p: "10px 14px",
                        borderBottom: `2px solid ${colors.border}`,
                      }}
                    >
                      {h}
                    </Box>
                  ),
                )}
              </Box>
            </Box>
            <Box component="tbody">
              {recent.map((c) => {
                const meta = STATUS_META[c.status] || STATUS_META.new;
                return (
                  <Box
                    component="tr"
                    key={c._id}
                    onClick={() => navigate(`/candidate/${c._id}`)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#f6fafa" },
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        p: "12px 14px",
                        borderBottom: `1px solid ${colors.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: avatarColorFor(c.name),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 11,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {initialsFor(c.name)}
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: colors.navy,
                          }}
                        >
                          {c.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: colors.navySoft,
                            fontWeight: 500,
                          }}
                        >
                          {c.email || "—"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: "14px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderBottom: `1px solid ${colors.border}`,
                        textTransform: "capitalize",
                      }}
                    >
                      {c.tier}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: "14px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 70,
                          height: 6,
                          bgcolor: "#f1f5f7",
                          borderRadius: "3px",
                          overflow: "hidden",
                          display: "inline-block",
                          mr: 1,
                          verticalAlign: "middle",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            height: "100%",
                            display: "block",
                            borderRadius: "3px",
                            width: `${meta.percent}%`,
                            bgcolor: meta.color,
                          }}
                        />
                      </Box>
                      {meta.label}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: "14px",
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          px: 1.1,
                          py: 0.4,
                          borderRadius: "7px",
                          bgcolor: meta.badgeBg,
                          color: meta.badgeColor,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {meta.label}
                      </Box>
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: "14px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Panel>
    </Box>
  );
}
