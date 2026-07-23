// src/pages/RejectedCandidates.jsx
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";
import axios from "../utils/api";

const ROUND_LABELS = {
  tech: "Tech Round",
  manager: "Manager Round",
  hr: "HR Round",
};

export default function RejectedCandidates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/interviews/rejected")
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Rejected Candidates
      </Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No rejections yet.</Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 3 }}>
          {rows.map((r) => (
            <Paper key={r._id} sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                flexWrap="wrap"
              >
                <Box>
                  <Typography fontWeight={700}>{r.candidate?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {r.candidate?.email}
                  </Typography>
                </Box>
                <Chip label={ROUND_LABELS[r.roundType]} size="small" />
              </Stack>
              {r.feedback?.notes && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1 }}
                  color="text.secondary"
                >
                  {r.feedback.notes}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
}
