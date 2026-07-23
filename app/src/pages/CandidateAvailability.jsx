// src/pages/CandidateAvailability.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { CheckCircle2, Plus, X } from "lucide-react";
import axios from "../utils/api";

export default function CandidateAvailability() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [slots, setSlots] = useState([""]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    axios
      .get(`/candidates/availability/${token}`)
      .then((res) => {
        setData(res.data);
        if (res.data.existingSlots?.length) setSlots(res.data.existingSlots);
        if (res.data.existingNotes) setNotes(res.data.existingNotes);
      })
      .catch((err) =>
        setLoadError(
          err.response?.data?.message || "This link is invalid or has expired.",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  console.log("token is", token);
  const updateSlot = (i, value) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  const addSlot = () => setSlots((prev) => [...prev, ""]);
  const removeSlot = (i) =>
    setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    const cleaned = slots.map((s) => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setSubmitError("Please add at least one available time slot.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      await axios.post(`/candidates/availability/${token}`, {
        slots: cleaned,
        notes,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          "Something went wrong submitting your availability.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );

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

  if (submitted || data.alreadySubmitted) {
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
              Availability Submitted
            </Typography>
            <Typography color="text.secondary">
              Thank you — the hiring team will be in touch to confirm a time.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7fafb", py: 6, px: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Share Your Availability
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Hi {data.name}, congratulations on being shortlisted! Please share a
            few time slots that work for you.
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {slots.map((slot, i) => (
              <Stack key={i} direction="row" spacing={1}>
                <TextField
                  fullWidth
                  placeholder="e.g. Mon 28th July, 10 AM – 12 PM"
                  value={slot}
                  onChange={(e) => updateSlot(i, e.target.value)}
                />
                {slots.length > 1 && (
                  <Button
                    onClick={() => removeSlot(i)}
                    sx={{ minWidth: 0, px: 1.5 }}
                    color="error"
                  >
                    <X size={16} />
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>

          <Button
            startIcon={<Plus size={16} />}
            onClick={addSlot}
            sx={{ mb: 3, textTransform: "none" }}
          >
            Add another slot
          </Button>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Anything else you'd like us to know? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

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
              "Submit Availability"
            )}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
