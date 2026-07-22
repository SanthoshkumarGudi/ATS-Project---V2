// src/components/InterviewSchedulerModal.jsx
import { useState } from "react";
import {
  Modal, Box, Button, TextField, MenuItem, Typography, CircularProgress,
} from "@mui/material";
import axios from "../utils/api";

const ROUND_OPTIONS = [
  { value: "hr", label: "HR Round" },
  { value: "tech", label: "Technical Round" },
  { value: "manager", label: "Manager Round" },
];

export default function InterviewSchedulerModal({
  open, onClose, candidate, expectedRoundLabel, manualMode, reschedule, interviewId, onSuccess,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [manualRoundType, setManualRoundType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  const handleSubmit = async () => {
    if (!date || !time || !interviewerName || !interviewerEmail) {
      setError("Please fill in date, time, interviewer name, and interviewer email.");
      return;
    }
    if (manualMode && !manualRoundType) {
      setError("Please select which round to schedule.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (reschedule) {
        await axios.put(`/interviews/${interviewId}/reschedule`, {
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
          ...(manualMode ? { roundType: manualRoundType } : {}),
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
          {reschedule ? "Reschedule Interview" : manualMode ? "Schedule a Specific Round" : "Schedule Interview"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {manualMode ? "Manual override — pick any round, in any order" : (expectedRoundLabel || "")}
        </Typography>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        {manualMode && !reschedule && (
          <TextField
            select fullWidth label="Round Type" sx={{ mb: 2 }}
            value={manualRoundType}
            onChange={(e) => setManualRoundType(e.target.value)}
          >
            {ROUND_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        )}

        <TextField label="Date" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Time" type="time" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={time} onChange={(e) => setTime(e.target.value)} />
        <TextField label="Interviewer Name" fullWidth sx={{ mb: 2 }} value={interviewerName} onChange={(e) => setInterviewerName(e.target.value)} />
        <TextField label="Interviewer Email" fullWidth sx={{ mb: 3 }} value={interviewerEmail} onChange={(e) => setInterviewerEmail(e.target.value)} />

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