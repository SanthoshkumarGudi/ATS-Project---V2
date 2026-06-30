import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Box,
  Table,
} from "@mui/material";
import { Search } from "@mui/icons-material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CandidatesList() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user || user.role === "candidate") {
      setLoading(false);
      return;
    }

    const fetchCandidates = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/applications/candidates-dashboard`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setCandidates(res.data);
        setFilteredCandidates(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error loading candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [user]);

  //  Optimized counts using useMemo
  const stats = useMemo(() => {
    return {
      all: candidates.length,
      offered: candidates.filter((c) => c.status === "offered").length,
      rejected: candidates.filter((c) => c.status === "rejected").length,
      "on-hold": candidates.filter((c) => c.status === "on-hold").length,
    };
  }, [candidates]);

  const handleFilter = (status) => {
    setActiveFilter(status);
    if (status === "all") {
      setFilteredCandidates(candidates);
    } else {
      setFilteredCandidates(candidates.filter((c) => c.status === status));
    }
  };

  const getStatusColor = (status) => {
    const map = {
      offered: "success",
      rejected: "error",
      "on-hold": "warning",
      "in-interview": "info",
    };
    return map[status] || "default";
  };

  const filters = [
    { label: "All", value: "all" },
    { label: "Hired", value: "offered" },
    { label: "Rejected", value: "rejected" },
    { label: "On Hold", value: "on-hold" },
  ];

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 6 }}>
        <CircularProgress />
        <Typography mt={2}>Loading candidates...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const candidateInformation=['candidate Image', 'Name', 'Email', 'Job Title', 'Department', 'Status', 'Applied On']

  return (
    <Container sx={{ mt: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          Candidates Dashboard
        </Typography>

        {/* Filters */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={activeFilter === f.value ? "contained" : "outlined"}
              onClick={() => handleFilter(f.value)}
              sx={{ borderRadius: 5 }}
            >
              {f.label}
              <Chip
                label={stats[f.value]}
                backgroundColor="rgba(233, 237, 242, 0.17)"
                size="small"
                sx={{ ml: 1 }}
              />
            </Button>
          ))}
        </Stack>
      </Stack>
      <Stack direction="row" spacing={2} mb={3}>
        <Typography variant="h6" color="text.secondary"></Typography>
        <Stack direction="row" spacing={1}>
          <Search color="action" />
          <input
            type="text"
            placeholder="Search candidates..."
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              setFilteredCandidates(
                candidates.filter(
                  (c) =>
                    c.candidate?.name?.toLowerCase().includes(query) ||
                    c.candidate?.email?.toLowerCase().includes(query) ||
                    c.job?.title?.toLowerCase().includes(query) ||
                    c.status.toLowerCase().includes(query),
                ),
              );
            }}
            style={{
              border: "none",
              borderBottom: "1px solid #ccc",
              outline: "none",
              padding: "4px 8px",
              width: "200px",
            }}
          />
        </Stack>
      </Stack>

      {/* Candidates */}
      {filteredCandidates.length === 0 ? (
        <Typography textAlign="center" mt={4}>
          No candidates found.
        </Typography>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>              
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[0]}</th>
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[1]}</th>
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[2]}</th>
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[3]}</th>
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[4]}</th>
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[5]}</th>
              <th style={{ textAlign: "left", padding: "12px" }}>{candidateInformation[6]}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>
                  {c.candidateprofile?.image ? (
                    <img
                      src={c.candidateprofile.image}
                      alt={c.candidateprofile.name}
                      style={{ width: 50, height: 50, borderRadius: "50%" }}
                    />
                  ) : (
                    <Chip label="No Image" size="small" />
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  {c.candidate?.name || "Unknown"}
                </td>
                <td style={{ padding: "12px" }}>
                  {c.candidate?.email || "No email"}
                </td>
                <td style={{ padding: "12px" }}>
                  {c.job?.title || "Unknown Job"}
                </td>
                <td style={{ padding: "12px" }}>
                  {c.job?.department || "N/A"}
                </td>
                <td style={{ padding: "12px" }}>
                  <Chip
                    label={c.status.toUpperCase()}
                    color={getStatusColor(c.status)}
                    size="small"
                  />
                </td>
                <td style={{ padding: "12px", color: "#555" }}>
                  {new Date(c.appliedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  );
}
