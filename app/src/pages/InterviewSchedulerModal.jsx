// src/components/InterviewSchedulerModal.jsx
import { useState } from "react";
import {
  Modal, Box, Button, TextField, Typography, CircularProgress,
} from "@mui/material";
import axios from "../utils/api";

// Mirrors backend/src/utils/tier.js STAGE_LABELS
const ROUND_LABELS = { hr: "HR Round", tech: "Technical Round", manager: "Manager Round" };

export default function InterviewSchedulerModal({ open, onClose, candidate, expectedRoundLabel, reschedule, interviewId, onSuccess }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!date || !time || !interviewerName) {
      setError("Please fill in date, time, and interviewer name.");
      return;
    }
    // The backend requires an interviewer email when scheduling a new round — the
    // feedback link can only be delivered (and only accessed) via that address.
    // Reschedules can leave it blank since the existing interview already has one on file.
    if (!reschedule && !interviewerEmail) {
      setError("Interviewer email is required — the feedback link is sent only to this address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (reschedule) {
         await axios.post("/interviews", {
          candidateId: candidate._id,
          scheduledAt: new Date(`${date}T${time}`),
          interviewerName,
          interviewerEmail,
        });
      } else {
        await axios.post("/interviews", {
          candidateId: candidate._id,
          scheduledAt: new Date(`${date}T${time}`),
          interviewerName,
          interviewerEmail,
          // Note: stage is derived server-side from candidate.status (fixed HR -> Tech ->
          // Manager sequence), so roundType is intentionally not sent here.
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 3, width: { xs: "90%", sm: 450 }, mx: "auto", mt: "10%", boxShadow: 24 }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          {reschedule ? "Reschedule Interview" : "Schedule Interview"}
        </Typography>
       <Typography color="text.secondary" sx={{ mb: 3 }}>
          {expectedRoundLabel || ""}
        </Typography>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        <TextField label="Date" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Time" type="time" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={time} onChange={(e) => setTime(e.target.value)} />
        <TextField label="Interviewer Name" fullWidth sx={{ mb: 2 }} value={interviewerName} onChange={(e) => setInterviewerName(e.target.value)} />
        <TextField
          label={reschedule ? "Interviewer Email (optional)" : "Interviewer Email"}
          type="email"
          required={!reschedule}
          fullWidth
          sx={{ mb: 3 }}
          value={interviewerEmail}
          onChange={(e) => setInterviewerEmail(e.target.value)}
          helperText={!reschedule ? "The feedback link is sent only to this address." : ""}
        />

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}