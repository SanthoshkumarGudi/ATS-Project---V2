// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, InputBase } from "@mui/material";
import { LayoutGrid, Users, Building2, XCircle, BarChart3, QrCode, LogOut, Search, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/dashboardColors";

const NAV_MAIN = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Talent Pool", path: "/pool", icon: Users },
  { label: "Internal Portal", path: "/internal-portal", icon: Building2 },
  { label: "Rejected", path: "/rejected", icon: XCircle },
];
const NAV_INSIGHTS = [
  { label: "Interview Analytics", path: "/interview-analytics", icon: BarChart3 },
  { label: "Share QR", path: "/qr", icon: QrCode },
];

const PAGE_META = {
  "/dashboard": { title: "Recruitment Overview", sub: "Match resumes to open needs, and track them through to hire" },
  "/pool": { title: "Talent Pool", sub: "Every resume submitted lands here" },
  "/internal-portal": { title: "Internal Portal", sub: "Search current employees for internal mobility" },
  "/rejected": { title: "Rejected Candidates", sub: "Candidates who didn't move forward" },
  "/interview-analytics": { title: "Interview Analytics", sub: "Round-by-round performance across the pipeline" },
  "/qr": { title: "Share QR Code", sub: "Let candidates apply by scanning a code — no login needed" },
};

function NavItem({ label, Icon, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", gap: 1.5, height: 44, mx: 1.5, px: 1.75,
        borderRadius: "10px", cursor: "pointer", fontSize: 13.5, fontWeight: 600,
        color: active ? "#fff" : "#b9c8d2",
        bgcolor: active ? colors.teal : "transparent",
        transition: "background-color .15s",
        "&:hover": { bgcolor: active ? colors.teal : "rgba(255,255,255,.06)" },
      }}
    >
      <Icon size={17} />
      {label}
    </Box>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const meta = PAGE_META[location.pathname] || { title: "Dashboard", sub: "" };
  const initials = (user?.name || "H M").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: colors.bg }}>
      {/* SIDEBAR */}
      <Box sx={{ width: 240, bgcolor: colors.navy, flexShrink: 0, py: 3.25, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mx: 2.75, mb: 4 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: colors.teal, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15 }}>P</Box>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 0.3 }}>Prixgen ATS</Typography>
        </Box>

        <Typography sx={{ color: "#6f8699", fontSize: 10, fontWeight: 800, letterSpacing: 1, mx: 2.75, mb: 1, textTransform: "uppercase" }}>Main</Typography>
        {NAV_MAIN.map((item) => (
          <NavItem key={item.path} label={item.label} Icon={item.icon} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
        ))}

        <Typography sx={{ color: "#6f8699", fontSize: 10, fontWeight: 800, letterSpacing: 1, mx: 2.75, mt: 2.25, mb: 1, textTransform: "uppercase" }}>Insights</Typography>
        {NAV_INSIGHTS.map((item) => (
          <NavItem key={item.path} label={item.label} Icon={item.icon} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
        ))}

        <Box sx={{ mt: "auto" }}>
          <NavItem label="Logout" Icon={LogOut} active={false} onClick={logout} />
        </Box>
      </Box>

      {/* MAIN */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box sx={{ height: 80, bgcolor: "#fff", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", px: 4, flexShrink: 0 }}>
          <Box>
            <Typography sx={{ fontSize: 19, fontWeight: 800, color: colors.navy }}>{meta.title}</Typography>
            <Typography sx={{ fontSize: 12, color: colors.navySoft, fontWeight: 600, mt: 0.25 }}>{meta.sub}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.25 }}>
            <Box sx={{ width: 280, height: 38, bgcolor: "#f3f7f9", border: `1px solid ${colors.border}`, borderRadius: "10px", display: "flex", alignItems: "center", px: 1.75, gap: 1 }}>
              <Search size={14} color="#8fa2ad" />
              <InputBase
                placeholder="Search candidates..."
                sx={{ fontSize: 12.5, color: "#8fa2ad", flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value) navigate(`/pool?q=${encodeURIComponent(e.target.value)}`);
                }}
              />
            </Box>
            <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#f3f7f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={17} color={colors.navy} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: "50%", bgcolor: colors.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: colors.tealDark, fontSize: 13 }}>
                {initials}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: colors.navy }}>{user?.name || "Hiring Manager"}</Typography>
                <Typography sx={{ fontSize: 10.5, color: colors.navySoft }}>Hiring Manager</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}