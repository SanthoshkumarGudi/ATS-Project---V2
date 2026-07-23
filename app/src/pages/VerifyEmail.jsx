// src/pages/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import { CheckCircle2, XCircle } from "lucide-react";
import axios from "../utils/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    console.log("token is ", token);

    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    axios
      .get("/auth/verify-email", { params: { token } })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      });
  }, [searchParams]);

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
          {status === "loading" && <CircularProgress sx={{ mb: 2 }} />}
          {status === "success" && (
            <CheckCircle2
              size={48}
              color="#15803d"
              style={{ marginBottom: 12 }}
            />
          )}
          {status === "error" && (
            <XCircle size={48} color="#b91c1c" style={{ marginBottom: 12 }} />
          )}

          <Typography variant="h6" fontWeight={700} gutterBottom>
            {status === "loading"
              ? "Verifying..."
              : status === "success"
                ? "Email Verified!"
                : "Verification Failed"}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>

          {status !== "loading" && (
            <Button variant="contained" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
