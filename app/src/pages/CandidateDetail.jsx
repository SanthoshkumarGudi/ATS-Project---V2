// src/pages/CandidateDetail.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Grid, Paper, Typography, Chip, Stack, Button, CircularProgress,
} from "@mui/material";
import { Eye, Download } from "lucide-react";
import axios from "../utils/api";
import TierBadge from "../components/TierBadge";
import InterviewSchedulerModal from "../components/InterviewSchedulerModal";
import { colors } from "../theme/dashboardColors";

const ROUND_LABELS = { hr: "HR Round", tech: "Technical Round", manager: "Manager Round" };
function displayRoundLabel(roundType, roundNumber = 1) {
  const base = ROUND_LABELS[roundType] || roundType;
  return roundNumber > 1 ? `${base} ${roundNumber}` : base;
}

const STATUS_LABELS = {
  new: "New",
  shortlisted: "Shortlisted",
  "hr-round": "HR Round",
  "tech-round": "Technical Round",
  "manager-round": "Manager Round",
  "final-evaluation": "Final Evaluation",
  hired: "Hired",
  "offer-sent": "Offer Sent",
  "offer-accepted": "Offer Accepted",
  onboarding: "Onboarding",
  rejected: "Rejected",
  "on-hold": "On Hold",
};

function downloadUrlFor(resumeUrl) {
  if (!resumeUrl) return resumeUrl;
  return resumeUrl.includes("/upload/") ? resumeUrl.replace("/upload/", "/upload/fl_attachment/") : resumeUrl;
}

// Builds a URL the browser will render INLINE, bypassing whatever
// Content-Disposition header Cloudinary sent on the original file.
async function buildInlinePreviewUrl(resumeUrl) {
  const isPdf = /\.pdf(\?|$)/i.test(resumeUrl);
  if (!isPdf) {
    // Word docs can't be rendered natively by the browser — fall back to Google's viewer
    return `https://docs.google.com/gview?url=${encodeURIComponent(resumeUrl)}&embedded=true`;
  }
  const response = await fetch(resumeUrl);
  const rawBlob = await response.blob();
  const pdfBlob = new Blob([rawBlob], { type: "application/pdf" }); // force correct MIME type
  return URL.createObjectURL(pdfBlob);
}

function SectionCard({ title, children, sx }) {
  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: "16px", boxShadow: "0 8px 22px rgba(16,40,60,.06), 0 2px 6px rgba(16,40,60,.04)", ...sx }}>
      {title && <Typography sx={{ fontSize: 15, fontWeight: 800, color: colors.navy, mb: 2 }}>{title}</Typography>}
      {children}
    </Paper>
  );
}

function StatusHistoryRow({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <Box sx={{ overflowX: "auto", pb: 0.5 }}>
      <Stack direction="row" alignItems="center" sx={{ minWidth: "max-content" }}>
        {history.map((h, idx) => {
          const isLast = idx === history.length - 1;
          const isRejected = h.status === "rejected";
          const isHold = h.status === "on-hold";
          const bg = !isLast ? "#f1f5f7" : isRejected ? colors.redBg : isHold ? "#fef9c3" : colors.teal;
          const fg = !isLast ? colors.navySoft : isRejected ? colors.red : isHold ? "#a16207" : "#fff";
          return (
            <Box key={idx} sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Box sx={{
                  px: 1.75, py: 0.9, borderRadius: "999px", bgcolor: bg, color: fg,
                  fontWeight: isLast ? 800 : 600, fontSize: 12.5, whiteSpace: "nowrap",
                }}>
                  {STATUS_LABELS[h.status] || h.status}
                </Box>
                <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: 0.5 }}>
                  {new Date(h.changedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </Typography>
              </Box>
              {idx < history.length - 1 && <Box sx={{ width: 26, height: 2, bgcolor: colors.border, flexShrink: 0 }} />}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [nextRound, setNextRound] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState(null); // null = closed
  const [resumeLoading, setResumeLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, iRes, nRes] = await Promise.all([
        axios.get(`/candidates/${id}`),
        axios.get(`/interviews/candidate/${id}`),
        axios.get(`/candidates/${id}/next-round`),
      ]);
      setCandidate(cRes.data);
      setInterviews(iRes.data);
      setNextRound(nRes.data.next);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Revoke the blob URL on unmount (or whenever it changes) to avoid leaking memory
  useEffect(() => {
    return () => {
      if (resumePreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(resumePreviewUrl);
    };
  }, [resumePreviewUrl]);

  const updateStatus = async (status) => {
    await axios.patch(`/candidates/${id}`, { status });
    load();
  };

  const handleToggleResumePreview = async () => {
    if (resumePreviewUrl) {
      if (resumePreviewUrl.startsWith("blob:")) URL.revokeObjectURL(resumePreviewUrl);
      setResumePreviewUrl(null);
      return;
    }
    setResumeLoading(true);
    try {
      const url = await buildInlinePreviewUrl(candidate.resumeUrl);
      setResumePreviewUrl(url);
    } catch (err) {
      console.error("Resume preview failed:", err);
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading || !candidate) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  const canScheduleNext = !!nextRound && candidate.status !== "rejected";
  const isShortlistedOrLater = candidate.status !== "new";

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button onClick={() => navigate("/pool")} sx={{ mb: 2, textTransform: "none" }}>&larr; Back to Talent Pool</Button>

      <Stack spacing={3}>
        {/* Header */}
        <SectionCard>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: colors.navy }}>{candidate.name}</Typography>
              <Typography color="text.secondary">{candidate.email} {candidate.phone && `· ${candidate.phone}`}</Typography>
              <Typography color="text.secondary">{candidate.location}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <TierBadge tier={candidate.tier} />
              <Chip label={STATUS_LABELS[candidate.status] || candidate.status} sx={{ bgcolor: "#f1f5f9", fontWeight: 700 }} />
            </Stack>
          </Stack>
        </SectionCard>

        {/* Status history */}
        <SectionCard title="Status History">
          <StatusHistoryRow history={candidate.statusHistory} />
        </SectionCard>

        {/* Profile */}
        <SectionCard title="Profile">
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Experience</Typography>
              <Typography fontWeight={600}>{candidate.experienceYears || 0} years</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined" startIcon={<Eye size={16} />} sx={{ textTransform: "none" }}
                  onClick={handleToggleResumePreview} disabled={resumeLoading}
                >
                  {resumeLoading ? "Loading..." : resumePreviewUrl ? "Hide Resume" : "View Resume"}
                </Button>
                <Button href={downloadUrlFor(candidate.resumeUrl)} variant="outlined" startIcon={<Download size={16} />} sx={{ textTransform: "none" }}>
                  Download
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {resumePreviewUrl && (
            <Box sx={{ mb: 2, borderRadius: "12px", overflow: "hidden", border: "1px solid #e3ebee" }}>
              <Box component="iframe" src={resumePreviewUrl} title="Resume preview" sx={{ width: "100%", height: 700, border: "none", display: "block" }} />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Skills</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 2 }}>
            {(candidate.skills || []).map((s) => <Chip key={s} label={s} size="small" />)}
          </Stack>

          {["summary", "experience", "internships", "education", "projects", "certifications"].map((key) =>
            candidate.sections?.[key] ? (
              <Box key={key} sx={{ mt: 2, p: 2, bgcolor: "#f8fbfb", borderRadius: "12px" }}>
                <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 800, color: colors.navySoft }}>
                  {key}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                  {candidate.sections[key]}
                </Typography>
              </Box>
            ) : null
          )}

          {candidate.status === "new" && (
            <Button variant="contained" sx={{ mt: 3 }} onClick={() => updateStatus("shortlisted")}>
              Shortlist Candidate
            </Button>
          )}
        </SectionCard>

        {/* Interview rounds — only visible once shortlisted */}
        {isShortlistedOrLater && (
          <SectionCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: colors.navy }}>
                Interview Rounds (HR → Technical → Manager)
              </Typography>
              <Stack direction="row" spacing={1}>
                {canScheduleNext && (
                  <Button variant="contained" onClick={() => { setRescheduleTarget(null); setManualMode(false); setSchedulerOpen(true); }}>
                    Schedule {nextRound.label}
                  </Button>
                )}
                <Button variant="outlined" onClick={() => { setRescheduleTarget(null); setManualMode(true); setSchedulerOpen(true); }}>
                  Schedule a Specific Round
                </Button>
              </Stack>
            </Stack>

            {interviews.length === 0 ? (
              <Typography color="text.secondary">No interviews scheduled yet.</Typography>
            ) : (
              <Stack spacing={2}>
                {interviews.map((iv) => (
                  <Paper key={iv._id} variant="outlined" sx={{ p: 2, borderRadius: "12px" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                      <Box>
                        <Typography fontWeight={700}>{displayRoundLabel(iv.roundType, iv.roundNumber)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(iv.scheduledAt).toLocaleString("en-IN")} · {iv.interviewerName}
                        </Typography>
                        <Chip size="small" label={iv.status} sx={{ mt: 1 }} />
                        {iv.meetingLink && (
                          <Button size="small" href={iv.meetingLink} target="_blank" sx={{ ml: 1, textTransform: "none" }}>
                            Join Meet
                          </Button>
                        )}
                      </Box>
                      {iv.status === "scheduled" && (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => { setRescheduleTarget(iv); setManualMode(false); setSchedulerOpen(true); }}>
                            Reschedule
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={async () => { await axios.post(`/interviews/${iv._id}/resend-feedback-link`); load(); }}
                          >
                            Resend Feedback Link
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                    {iv.feedback?.recommendation && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                        <Typography variant="body2"><strong>Recommendation:</strong> {iv.feedback.recommendation}</Typography>
                        {iv.feedback.notes && <Typography variant="body2" color="text.secondary">{iv.feedback.notes}</Typography>}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}

            {!nextRound && candidate.status === "final-evaluation" && (
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography sx={{ mb: 2 }}>All rounds complete — ready for final evaluation.</Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button variant="contained" color="success" onClick={() => updateStatus("hired")}>Mark as Hired</Button>
                  <Button variant="outlined" color="error" onClick={() => updateStatus("rejected")}>Reject</Button>
                </Stack>
              </Box>
            )}

            {candidate.status === "on-hold" && !nextRound && (
              <Typography color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
                This candidate is on hold. Use "Schedule a Specific Round" to resume when ready.
              </Typography>
            )}

            {candidate.status === "hired" && (
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Button variant="contained" onClick={() => navigate(`/candidate/${id}/offer`)}>
                  Continue to Offer & Onboarding
                </Button>
              </Box>
            )}
          </SectionCard>
        )}
      </Stack>

      {schedulerOpen && (
        <InterviewSchedulerModal
          open={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
          candidate={candidate}
          expectedRoundLabel={rescheduleTarget ? displayRoundLabel(rescheduleTarget.roundType, rescheduleTarget.roundNumber) : nextRound?.label}
          manualMode={manualMode}
          reschedule={!!rescheduleTarget}
          interviewId={rescheduleTarget?._id}
          onSuccess={load}
        />
      )}
    </Container>
  );
}