// src/components/Navbar.jsx
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

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Share QR", path: "/qr" },
    { label: "Talent Pool", path: "/pool" },
    { label: "Internal Portal", path: "/internal-portal" },
    { label: "Rejected", path: "/rejected" },
    { label: "Interview Analytics", path: "/interview-analytics" },
    { label: "Logout", onClick: () => logout(), isLogout: true },
  ];

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
      <Stack direction="row" justifyContent="space-between">
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
            onClick={() => navigate("/dashboard")}
          >
            Prixgen
          </Typography>
        </Stack>

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
          <Stack direction="row" spacing={3} alignItems="center">
            <Stack direction="row" spacing={3}>
              {navItems
                .filter((i) => !i.isLogout)
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
            <Button
              variant="contained"
              onClick={() => logout()}
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
        )}
      </Stack>
    </Box>
  );
};
