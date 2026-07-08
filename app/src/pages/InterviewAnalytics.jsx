// src/pages/InterviewAnalytics.jsx
import { useEffect, useState } from "react";
import { Container, Typography, Grid, Paper, Box, CircularProgress } from "@mui/material";
import axios from "../utils/api";

export default function InterviewAnalytics() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/interviews").then((res) => setInterviews(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;

  const total = interviews.length;
  const completed = interviews.filter((i) => i.status === "completed").length;
  const scheduled = interviews.filter((i) => i.status === "scheduled").length;
  const byRound = ["tech", "manager", "hr"].map((r) => ({
    round: r,
    count: interviews.filter((i) => i.roundType === r).length,
  }));
  const recommendations = ["hire", "reject", "next-round", "hold"].map((rec) => ({
    rec,
    count: interviews.filter((i) => i.feedback?.recommendation === rec).length,
  }));

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
      <Typography variant="h4" fontWeight={800} gutterBottom>Interview Analytics</Typography>

      <Grid container spacing={2} sx={{ mt: 1, mb: 4 }}>
        {stat("Total Interviews", total)}
        {stat("Scheduled", scheduled)}
        {stat("Completed", completed)}
        {stat("Completion Rate", total ? `${Math.round((completed / total) * 100)}%` : "0%")}
      </Grid>

      <Typography variant="h6" fontWeight={700} gutterBottom>By Round Type</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {byRound.map((r) => (
          <Grid item xs={4} key={r.round}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700}>{r.count}</Typography>
              <Typography color="text.secondary" sx={{ textTransform: "capitalize" }}>{r.round}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={700} gutterBottom>By Recommendation</Typography>
      <Grid container spacing={2}>
        {recommendations.map((r) => (
          <Grid item xs={6} sm={3} key={r.rec}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700}>{r.count}</Typography>
              <Typography color="text.secondary" sx={{ textTransform: "capitalize" }}>{r.rec}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}