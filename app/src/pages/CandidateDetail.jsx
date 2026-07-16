// src/pages/CandidateDetail.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Grid, Paper, Typography, Chip, Stack, Button,
  CircularProgress, Divider,
} from "@mui/material";
import axios from "../utils/api";
import TierBadge from "../components/TierBadge";
import InterviewSchedulerModal from "../components/InterviewSchedulerModal";

const ROUND_LABELS = { hr: "HR Round", tech: "Technical Round", manager: "Manager Round" };
function displayRoundLabel(roundType, roundNumber = 1) {
  const base = ROUND_LABELS[roundType] || roundType;
  return roundNumber > 1 ? `${base} ${roundNumber}` : base;
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [nextRound, setNextRound] = useState(undefined); // undefined = loading, null = none, {} = has a next round
  const [loading, setLoading] = useState(true);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

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
      setNextRound(nRes.data.next); // null if no automatic next round
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status) => {
    await axios.patch(`/candidates/${id}`, { status });
    load();
  };

  if (loading || !candidate) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  const canScheduleNext = !!nextRound && candidate.status !== "rejected";

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button onClick={() => navigate("/pool")} sx={{ mb: 2, textTransform: "none" }}>&larr; Back to Talent Pool</Button>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap">
          <Box>
            <Typography variant="h4" fontWeight={800}>{candidate.name}</Typography>
            <Typography color="text.secondary">{candidate.email} {candidate.phone && `· ${candidate.phone}`}</Typography>
            <Typography color="text.secondary">{candidate.location}</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TierBadge tier={candidate.tier} />
            <Chip label={candidate.status} sx={{ bgcolor: "#f1f5f9", fontWeight: 600 }} />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Experience</Typography>
            <Typography>{candidate.experienceYears || 0} years</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button href={candidate.resumeUrl} target="_blank" rel="noreferrer" variant="outlined" fullWidth sx={{ textTransform: "none" }}>
              View Resume
            </Button>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Skills</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          {(candidate.skills || []).map((s) => <Chip key={s} label={s} size="small" />)}
        </Stack>
        {["summary", "experience", "internships", "education", "projects", "certifications"].map((key) =>
          candidate.sections?.[key] ? (
            <Box key={key} sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize", mb: 0.5 }}>
                {key}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
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
      </Paper>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Interview Rounds (HR → Technical → Manager)
          </Typography>
          {canScheduleNext && (
            <Button variant="contained" onClick={() => { setRescheduleTarget(null); setSchedulerOpen(true); }}>
              Schedule {nextRound.label}
            </Button>
          )}
        </Stack>

        {interviews.length === 0 ? (
          <Typography color="text.secondary">No interviews scheduled yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {interviews.map((iv) => (
              <Paper key={iv._id} variant="outlined" sx={{ p: 2 }}>
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
                      <Button size="small" variant="outlined" onClick={() => { setRescheduleTarget(iv); setSchedulerOpen(true); }}>
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
            This candidate is on hold. Update their status manually, or use the API's manual-round option to resume.
          </Typography>
        )}

        {candidate.status === "hired" && (
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button variant="contained" onClick={() => navigate(`/candidate/${id}/offer`)}>
              Continue to Offer & Onboarding
            </Button>
          </Box>
        )}
      </Paper>

      {schedulerOpen && (
        <InterviewSchedulerModal
          open={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
          candidate={candidate}
          expectedRoundLabel={rescheduleTarget ? displayRoundLabel(rescheduleTarget.roundType, rescheduleTarget.roundNumber) : nextRound?.label}
          reschedule={!!rescheduleTarget}
          interviewId={rescheduleTarget?._id}
          onSuccess={load}
        />
      )}
    </Container>
  );
}