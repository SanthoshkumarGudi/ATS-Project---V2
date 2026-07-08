// src/pages/OfferOnboarding.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Stack, Checkbox, FormControlLabel,
  TextField, Button, CircularProgress, Box,
} from "@mui/material";
import axios from "../utils/api";

export default function OfferOnboarding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingDate, setOnboardingDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await axios.get(`/candidates/${id}`);
    setCandidate(data);
    setOnboardingDate(data.onboarding?.onboardingDate ? data.onboarding.onboardingDate.slice(0, 10) : "");
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const markOfferSent = async () => {
    await axios.patch(`/candidates/${id}/offer`, { offerSentAt: new Date(), status: "offer-sent" });
    load();
  };
  const markOfferAccepted = async () => {
    await axios.patch(`/candidates/${id}/offer`, { offerAcceptedAt: new Date(), status: "offer-accepted" });
    load();
  };
  const toggleDocuments = async (checked) => {
    await axios.patch(`/candidates/${id}/offer`, { documentsCollected: checked });
    load();
  };
  const saveOnboardingDate = async () => {
    await axios.patch(`/candidates/${id}/offer`, { onboardingDate, status: "onboarding" });
    load();
  };

  if (loading || !candidate) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Button onClick={() => navigate(`/candidate/${id}`)} sx={{ mb: 2, textTransform: "none" }}>&larr; Back to candidate</Button>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>Offer & Pre-Onboarding — {candidate.name}</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Current status: {candidate.status}</Typography>

        <Stack spacing={2}>
          <Button
            variant={candidate.onboarding?.offerSentAt ? "outlined" : "contained"}
            onClick={markOfferSent}
            disabled={!!candidate.onboarding?.offerSentAt}
          >
            {candidate.onboarding?.offerSentAt ? "Offer Sent ✓" : "Mark Offer as Sent"}
          </Button>

          <Button
            variant={candidate.onboarding?.offerAcceptedAt ? "outlined" : "contained"}
            onClick={markOfferAccepted}
            disabled={!candidate.onboarding?.offerSentAt || !!candidate.onboarding?.offerAcceptedAt}
          >
            {candidate.onboarding?.offerAcceptedAt ? "Offer Accepted ✓" : "Mark Offer as Accepted"}
          </Button>

          <FormControlLabel
            control={
              <Checkbox
                checked={!!candidate.onboarding?.documentsCollected}
                onChange={(e) => toggleDocuments(e.target.checked)}
              />
            }
            label="Documents collected"
          />

          <TextField
            label="Onboarding Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={onboardingDate}
            onChange={(e) => setOnboardingDate(e.target.value)}
          />
          <Button variant="contained" onClick={saveOnboardingDate} disabled={!onboardingDate}>
            Save & Mark Onboarding
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}