// src/pages/InterviewFeedbackPublic.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Rating,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { CheckCircle2 } from "lucide-react";
import axios from "../utils/api";

const ROUND_LABELS = {
  hr: "HR Round",
  tech: "Technical Round",
  manager: "Manager Round",
};
function displayRoundLabel(data) {
  return (
    data.label ||
    ROUND_LABELS[data.roundType] +
      (data.roundNumber > 1 ? ` ${data.roundNumber}` : "")
  );
}
export default function InterviewFeedbackPublic() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    performance: 1,
    notes: "",
    recommendation: "",
    negotiatedSalary: "",
    noticePeriod: "",
  });

  useEffect(() => {
    axios
      .get(`/interviews/feedback/${token}`)
      .then((res) => setData(res.data))
      .catch((err) =>
        setLoadError(
          err.response?.data?.message || "This link is invalid or has expired.",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!form.recommendation) {
      setSubmitError("Please select a recommendation.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      await axios.post(`/interviews/feedback/${token}`, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          "Something went wrong submitting your feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Container maxWidth="xs">
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Link Unavailable
            </Typography>
            <Typography color="text.secondary">{loadError}</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Container maxWidth="xs">
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <CheckCircle2
              size={48}
              color="#15803d"
              style={{ marginBottom: 12 }}
            />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Feedback Submitted
            </Typography>
            <Typography color="text.secondary">
              Thank you — the hiring team has been notified.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  const { candidate } = data;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7fafb", py: 6, px: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Interview Feedback
          </Typography>
          <Chip label={displayRoundLabel(data)} sx={{ mb: 2 }} />
          {/* Full candidate profile, per interviewer feedback requirements */}
          <Box sx={{ p: 2.5, bgcolor: "#f8fbfb", borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              {candidate.name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {candidate.email} {candidate.phone && `· ${candidate.phone}`}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {candidate.location}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Tier:{" "}
              <strong style={{ textTransform: "capitalize" }}>
                {candidate.tier}
              </strong>{" "}
              · {candidate.experienceYears || 0} yrs experience
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              sx={{ gap: 0.5, mt: 1.5 }}
            >
              {(candidate.skills || []).map((s) => (
                <Chip key={s} label={s} size="small" />
              ))}
            </Stack>
            {candidate.resumeUrl && (
              <Button
                href={candidate.resumeUrl}
                target="_blank"
                rel="noreferrer"
                size="small"
                sx={{ mt: 1.5, textTransform: "none" }}
              >
                View Resume
              </Button>
            )}
            {[
              "summary",
              "experience",
              "internships",
              "education",
              "projects",
              "certifications",
            ].map((key) =>
              candidate.sections?.[key] ? (
                <Box key={key} sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "capitalize", fontWeight: 700 }}
                  >
                    {key}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {candidate.sections[key]}
                  </Typography>
                </Box>
              ) : null,
            )}
          </Box>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="performance-rating-label">
              Overall Rating
            </InputLabel>
            <Select
              labelId="performance-rating-label"
              value={form.performance}
              label="Overall Rating"
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  performance: e.target.value,
                }))
              }
            >
              {[...Array(10)].map((_, index) => (
                <MenuItem key={index + 1} value={index + 1}>
                  {index + 1} / 10
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            select
            fullWidth
            label="Recommendation"
            sx={{ mb: 2 }}
            value={form.recommendation}
            onChange={(e) =>
              setForm((p) => ({ ...p, recommendation: e.target.value }))
            }
            required
          >
            {/* <MenuItem value="hire">Hire</MenuItem> */}
            <MenuItem value="proceed">Proceed to Next Stage</MenuItem>
            <MenuItem value="repeat">
              Needs Another Round at This Stage
            </MenuItem>
            <MenuItem value="hold">Hold</MenuItem>
            <MenuItem value="reject">Reject</MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            sx={{ mb: 2 }}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />

          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Negotiated Salary (optional)"
              value={form.negotiatedSalary}
              onChange={(e) =>
                setForm((p) => ({ ...p, negotiatedSalary: e.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Notice Period (optional)"
              value={form.noticePeriod}
              onChange={(e) =>
                setForm((p) => ({ ...p, noticePeriod: e.target.value }))
              }
            />
          </Stack>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
