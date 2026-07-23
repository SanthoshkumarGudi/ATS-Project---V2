// src/pages/InternalPortal.jsx
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  InputAdornment,
  CircularProgress,
  Button,
} from "@mui/material";
import { Search, Plus } from "lucide-react";
import axios from "../utils/api";
import AddEmployeeModal from "../components/AddEmployeeModal";

const AVAILABILITY_STYLES = {
  available: { bg: "#dcfce7", color: "#15803d", label: "Available" },
  "on-bench": { bg: "#fef9c3", color: "#a16207", label: "On Bench" },
  "not-available": { bg: "#fee2e2", color: "#b91c1c", label: "Not Available" },
};

export default function InternalPortal() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [availability, setAvailability] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (availability) params.availability = availability;
      const { data } = await axios.get("/employees", { params });
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [q, availability]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Internal Portal
          </Typography>
          <Typography color="text.secondary">
            Search current employees for internal mobility.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setAddOpen(true)}
        >
          Add Employee
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ my: 3 }}>
        <TextField
          placeholder="Search by name, role, or skill"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Availability"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="on-bench">On Bench</MenuItem>
          <MenuItem value="not-available">Not Available</MenuItem>
        </TextField>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : employees.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
          No employees in the directory yet — add your first one.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {employees.map((e) => {
            const style =
              AVAILABILITY_STYLES[e.availability] ||
              AVAILABILITY_STYLES.available;
            return (
              <Grid item xs={12} sm={6} md={4} key={e._id}>
                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {e.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={style.label}
                        sx={{
                          bgcolor: style.bg,
                          color: style.color,
                          fontWeight: 600,
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {e.currentRole} {e.department && `· ${e.department}`}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {e.experienceYears || 0} yrs experience
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      sx={{ gap: 0.5, mb: 1 }}
                    >
                      {(e.skills || []).slice(0, 5).map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    {e.email && (
                      <Typography variant="caption" color="text.secondary">
                        {e.email}
                      </Typography>
                    )}
                    {e.resumeUrl && (
                      <Button
                        size="small"
                        href={e.resumeUrl}
                        target="_blank"
                        sx={{ display: "block", mt: 1, textTransform: "none" }}
                      >
                        View Resume
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <AddEmployeeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchEmployees}
      />
    </Container>
  );
}
