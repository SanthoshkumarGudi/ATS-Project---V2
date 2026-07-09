// src/components/CompleteOnboardingModal.jsx
import { useState } from "react";
import {
  Modal, Box, Typography, TextField, Button, Stack, CircularProgress,
} from "@mui/material";
import axios from "../utils/api";

export default function CompleteOnboardingModal({ open, onClose, candidate, onSuccess }) {
  const [department, setDepartment] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!department || !currentRole) {
      setError("Both Department and Current Role are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post(`/employees/from-candidate/${candidate._id}`, { department, currentRole });
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
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 3, width: { xs: "90%", sm: 420 }, mx: "auto", mt: "15%", boxShadow: 24 }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>Complete Onboarding</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {candidate?.name} will be added to the Internal Portal as an employee. We just need two details that
          weren't part of their application.
        </Typography>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        <Stack spacing={2}>
          <TextField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" required />
          <TextField label="Current Role" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Backend Developer" required />
        </Stack>

        <Box display="flex" gap={2} sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} fullWidth disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirm & Add to Internal Portal"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}