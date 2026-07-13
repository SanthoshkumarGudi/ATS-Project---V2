// src/pages/TalentPool.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Typography, TextField, MenuItem, Grid, Card,
  CardContent, CardActionArea, Chip, Stack, InputAdornment, CircularProgress,
} from "@mui/material";
import { Search } from "lucide-react";
import axios from "../utils/api";
import TierBadge from "../components/TierBadge";

const STATUS_LABELS = {
  new: "New",
  shortlisted: "Shortlisted",
  "tech-round": "Tech Round",
  "manager-round": "Manager Round",
  "hr-round": "HR Round",
  "final-evaluation": "Final Evaluation",
  hired: "Hired",
  "offer-sent": "Offer Sent",
  "offer-accepted": "Offer Accepted",
  onboarding: "Onboarding",
  rejected: "Rejected",
  "on-hold": "On Hold",
};

export default function TalentPool() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (tier) params.tier = tier;
      if (status) params.status = status;
      const { data } = await axios.get("/candidates", { params });
      setCandidates(data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [q, tier, status]);

  useEffect(() => {
    const t = setTimeout(fetchCandidates, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchCandidates]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Talent Pool</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Every resume submitted lands here. Search, filter by tier, and open a candidate to shortlist, schedule interviews, or make an offer.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          placeholder="Search by name, email, or skill"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
          }}
        />
        <TextField select label="Tier" value={tier} onChange={(e) => setTier(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All Tiers</MenuItem>
          <MenuItem value="fresher">Fresher</MenuItem>
          <MenuItem value="mid">Mid</MenuItem>
          <MenuItem value="senior">Senior</MenuItem>
        </TextField>
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <MenuItem key={val} value={val}>{label}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading&& !error ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: "center", py: 8 }}>
          {error}
        </Typography>
      ) : candidates.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
          No candidates match these filters yet.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {candidates.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c._id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/candidate/${c._id}`)} sx={{ p: 2 }}>
                  <CardContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" fontWeight={700}>{c.name}</Typography>
                      <TierBadge tier={c.tier} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {c.email || "No email on file"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {c.experienceYears || 0} yrs experience
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1.5, gap: 0.5 }}>
                      {(c.skills || []).slice(0, 4).map((s) => (
                        <Chip key={s} label={s} size="small" variant="outlined" />
                      ))}
                    </Stack>
                    <Chip
                      label={STATUS_LABELS[c.status] || c.status}
                      size="small"
                      sx={{ bgcolor: "#f1f5f9", fontWeight: 600 }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}