// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Grid,
  Paper,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { styled, keyframes } from "@mui/system";
import atsImg2 from "../assets/ats_.png"; // Updated image with better design and colors

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Hero = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  background: "linear-gradient(135deg, #0f172a 0%, #1e2937 100%)",
  position: "relative",
  overflow: "hidden",
  color: "white",
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: "60px 50px",
  borderRadius: "24px",
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
  animation: `${fadeIn} 1s ease-out`,
  maxWidth: "620px",
}));

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Good Evening");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <Hero>
      {/* Background subtle grid effect */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <Container maxWidth="lg">
        <Grid container spacing={8} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} md={7}>
            <Box sx={{ maxWidth: 680 }}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 4,
                  fontWeight: 700,
                  color: "#94a3b8",
                  mb: 2,
                  display: "block",
                }}
              >
                {user ? `${greeting}, ${user.name}` : greeting}
              </Typography>

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "3.2rem", md: "4.8rem" },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  mb: 3,
                  background: "linear-gradient(90deg, #e0f2fe, #bae6fd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Smart Hiring.<br />
                Made Simple.
              </Typography>

              {/* <Typography
                variant="h6"
                sx={{
                  color: "#cbd5e1",
                  mb: 5,
                  fontWeight: 400,
                  maxWidth: "520px",
                  lineHeight: 1.6,
                }}
              >
                The intelligent Applicant Tracking System that helps companies
                hire faster and candidates find their dream job.
              </Typography> */}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                {!user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/login")}
                    sx={{
                      px: 6,
                      py: 2.5,
                      fontSize: "1.1rem",
                      borderRadius: "12px",
                      background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                      "&:hover": {
                        background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                      },
                    }}
                  >
                    Get Started Free
                  </Button>
                ) : user.role === "candidate" ? (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate("/jobs")}
                      sx={{ px: 6, py: 2.5, borderRadius: "12px", fontSize: "1.1rem" }}
                    >
                      Browse Open Jobs
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate("/my-applications")}
                      sx={{ px: 6, py: 2.5, borderRadius: "12px", fontSize: "1.1rem", color: "white", borderColor: "rgba(255,255,255,0.4)" }}
                    >
                      My Applications
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    // onClick={() => navigate("/dashboard")}
                      onClick={() => navigate("/interview-analytics")}
                    sx={{ px: 6, py: 2.5, borderRadius: "12px", fontSize: "1.1rem" }}
                  >
                    Go to Interview Analytics
                  </Button>
                )}
              </Stack>
            </Box>
          </Grid>

          {/* Right Side - Visual / Illustration */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                position: "relative",
                display: { xs: "none", md: "block" },
              }}
            >
              <Box
                component="img"
                src={atsImg2}
                alt="ATS Pro"
                sx={{
                  width: "100%",
                  maxWidth: 480,
                  opacity: 0.89,
                  borderRadius: "16px",
                  filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Hero>
  );
}