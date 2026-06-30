import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 900px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => logout();

  // ✅ SAME ROLE LOGIC (unchanged)
  const navItems = [];

  if (user.role === "candidate") {
    navItems.push({ label: "Jobs", path: "/jobs" });
    navItems.push({ label: "My Applications", path: "/my-applications" });
  }

  if (user.role === "hiring_manager" || user.role === "admin") {
    navItems.push({ label: "Dashboard", path: "/dashboard" });
    // navItems.push({ label: "Post Job", path: "/create-job" });
    navItems.push({ label: "Candidates", path: "/candidates-list" });
    navItems.push({
      label: "Interview Analytics",
      path: "/interview-analytics"
    });
  }

  if (user.role === "interviewer") {
    navItems.push({ label: "My Interviews", path: "/interviewer-dashboard" });
  }

  navItems.push({ label: "Logout", onClick: handleLogout, isLogout: true });

  return (
    <Box
      sx={{
        width: "95%",
        bgcolor: "#f8f9fb",
        px: { xs: 2, md: 6 },
        py: 2,
        borderBottom: "1px solid #eee",
      }}
    >
      <Stack
        direction="row"
        // alignItems="center"
        justifyContent="space-between"
      >
        {/*  Logo */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(90deg, #111, #4A90E2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            Prixgen 
          </Typography>
        </Stack>

        {/*  Mobile */}
        {isMobile ? (
          <>
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>

            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Box sx={{ width: 260 }}>
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography fontWeight="bold">Menu</Typography>
                  <IconButton onClick={() => setDrawerOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Divider />

                <List>
                  {navItems.map((item, i) => (
                    <ListItem key={i} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (item.path) navigate(item.path);
                          if (item.onClick) item.onClick();
                          setDrawerOpen(false);
                        }}
                      >
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            {/* 🔷 Right Side (Nav + Logout together) */}
            <Stack direction="row" spacing={3} alignItems="center">
              {/* Nav Items */}
              <Stack direction="row" spacing={3}>
                {navItems
                  .filter((item) => !item.isLogout)
                  .map((item, i) => (
                    <Typography
                      key={i}
                      onClick={() => navigate(item.path)}
                      sx={{
                        cursor: "pointer",
                        color: "#555",
                        fontWeight: 500,
                        "&:hover": { color: "#000" },
                      }}
                    >
                      {item.label}
                    </Typography>
                  ))}
              </Stack>

              {/* Logout Button */}
              <Button
                variant="contained"
                onClick={handleLogout}
                sx={{
                  textTransform: "none",
                  borderRadius: "999px",
                  px: 3,
                  bgcolor: "#0f172a",
                  "&:hover": { bgcolor: "#020617" },
                }}
              >
                Logout
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
};
