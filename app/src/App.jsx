// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import Footer from "./components/Footer";
import AuthPage from "./pages/AuthPage";
import ResumeUpload from "./pages/ResumeUpload";
import Dashboard from "./pages/Dashboard";
import TalentPool from "./pages/TalentPool";
import CandidateDetail from "./pages/CandidateDetail";
import OfferOnboarding from "./pages/OfferOnboarding";
import RejectedCandidates from "./pages/RejectedCandidates";
import InterviewAnalytics from "./pages/InterviewAnalytics";
import InternalPortal from "./pages/InternalPortal";
import ShareQR from "./pages/ShareQR";
import VerifyEmail from "./pages/VerifyEmail";
import InterviewFeedbackPublic from "./pages/InterviewFeedbackPublic";

function PublicPage({ children }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}

function ProtectedLayout({ user }) {
  return user ? <DashboardLayout /> : <Navigate to="/login" />;
}

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
      <Routes>
        {/* Public — no login needed */}
        <Route path="/" element={<PublicPage><ResumeUpload /></PublicPage>} />
        <Route path="/login" element={!user ? <PublicPage><AuthPage /></PublicPage> : <Navigate to="/dashboard" />} />
        <Route path="/verify-email" element={<PublicPage><VerifyEmail /></PublicPage>} />

        {/* interview feedback public route */}
        <Route path="/interview-feedback/:token" element={<InterviewFeedbackPublic />} />
        
        {/* Hiring Manager area — all share the sidebar/topbar shell */}
        <Route element={<ProtectedLayout user={user} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pool" element={<TalentPool />} />
          <Route path="/candidate/:id" element={<CandidateDetail />} />
          <Route path="/candidate/:id/offer" element={<OfferOnboarding />} />
          <Route path="/rejected" element={<RejectedCandidates />} />
          <Route path="/interview-analytics" element={<InterviewAnalytics />} />
          <Route path="/internal-portal" element={<InternalPortal />} />
          <Route path="/qr" element={<ShareQR />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}