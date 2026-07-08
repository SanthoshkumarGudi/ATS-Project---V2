// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import Footer from "./components/Footer";

import AuthPage from "./pages/AuthPage";
import ResumeUpload from "./pages/ResumeUpload";
import Dashboard from "./pages/Dashboard";
import TalentPool from "./pages/TalentPool";
import CandidateDetail from "./pages/CandidateDetail";
import OfferOnboarding from "./pages/OfferOnboarding";
import RejectedCandidates from "./pages/RejectedCandidates";
import InterviewAnalytics from "./pages/InterviewAnalytics";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
        <CircularProgress size={60} />
        <Typography>Loading your session...</Typography>
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Box>
        <Routes>
          {/* Public — no login needed */}
          <Route path="/" element={<ResumeUpload />} />
          <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />

          {/* Hiring Manager only */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/pool" element={user ? <TalentPool /> : <Navigate to="/login" />} />
          <Route path="/candidate/:id" element={user ? <CandidateDetail /> : <Navigate to="/login" />} />
          <Route path="/candidate/:id/offer" element={user ? <OfferOnboarding /> : <Navigate to="/login" />} />
          <Route path="/rejected" element={user ? <RejectedCandidates /> : <Navigate to="/login" />} />
          <Route path="/interview-analytics" element={user ? <InterviewAnalytics /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
      <Footer />
    </BrowserRouter>
  );
}