// src/pages/ResumeUpload.jsx
import { useState } from "react";
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, CircularProgress, Stack,
} from "@mui/material";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import axios from "../utils/api";

export default function ResumeUpload() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please attach your resume (PDF, DOC, or DOCX).");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);

      const { data } = await axios.post("/resumes/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
        <Container maxWidth="xs">
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <CheckCircle2 size={48} color="#15803d" style={{ marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>Resume Submitted!</Typography>
            <Typography color="text.secondary">{success.message}</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #ede9fe 100%)",
        px: 2,
        py: 6,
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                background: "linear-gradient(120deg, #4f46e5, #0d9488)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Join Our Talent Pool
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Drop your resume. Our hiring team will reach out if there's a fit.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>

            <Button
              component="label"
              fullWidth
              variant="outlined"
              startIcon={<UploadCloud size={18} />}
              sx={{ mt: 2, py: 1.5, borderRadius: 2, textTransform: "none" }}
            >
              {file ? file.name : "Attach Resume (PDF, DOC, DOCX)"}
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3, py: 1.4, borderRadius: 2, fontWeight: 600, textTransform: "none",
                background: "linear-gradient(120deg, #0f2a4a, #2c5282)",
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Submit Resume"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}