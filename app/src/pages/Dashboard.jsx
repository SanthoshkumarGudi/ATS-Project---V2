// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Grid, Paper, Box, CircularProgress, Button , Stack} from "@mui/material";
import axios from "../utils/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/candidates").then((res) => setCandidates(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;

  const total = candidates.length;
  const byTier = ["fresher", "mid", "senior"].map((t) => ({
    tier: t,
    count: candidates.filter((c) => c.tier === t).length,
  }));
  const inPipeline = candidates.filter((c) => !["hired", "rejected", "onboarding", "offer-accepted"].includes(c.status)).length;
  const hired = candidates.filter((c) => c.status === "hired" || c.status === "onboarding" || c.status === "offer-accepted").length;

  const stat = (label, value) => (
    <Grid item xs={6} sm={3}>
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h4" fontWeight={800}>{value}</Typography>
        <Typography color="text.secondary">{label}</Typography>
      </Paper>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Hiring Manager Dashboard</Typography>
        <Button variant="contained" onClick={() => navigate("/pool")}>Open Talent Pool</Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stat("Total in Pool", total)}
        {stat("Active Pipeline", inPipeline)}
        {stat("Hired", hired)}
        {stat("Rejected", candidates.filter((c) => c.status === "rejected").length)}
      </Grid>

      <Typography variant="h6" fontWeight={700} gutterBottom>Pool by Tier</Typography>
      <Grid container spacing={2}>
        {byTier.map((t) => (
          <Grid item xs={4} key={t.tier}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700}>{t.count}</Typography>
              <Typography color="text.secondary" sx={{ textTransform: "capitalize" }}>{t.tier}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}