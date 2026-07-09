// src/components/AddEmployeeModal.jsx
import { useState } from "react";
import {
  Modal, Box, Typography, TextField, Button, MenuItem, Stack, CircularProgress,
} from "@mui/material";
import axios from "../utils/api";

export default function AddEmployeeModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", department: "", currentRole: "",
    location: "", skills: "", experienceYears: "", availability: "available", notes: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name) {
      setError("Name is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append("resume", file);

      await axios.post("/employees", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 3, width: { xs: "90%", sm: 480 }, mx: "auto", mt: "5%", maxHeight: "85vh", overflowY: "auto", boxShadow: 24 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>Add Employee</Typography>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        <Stack spacing={2}>
          <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
          <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <TextField label="Department" name="department" value={form.department} onChange={handleChange} />
          <TextField label="Current Role" name="currentRole" value={form.currentRole} onChange={handleChange} />
          <TextField label="Location" name="location" value={form.location} onChange={handleChange} />
          <TextField label="Skills (comma separated)" name="skills" value={form.skills} onChange={handleChange} placeholder="Java, React, SQL" />
          <TextField label="Experience (years)" name="experienceYears" type="number" value={form.experienceYears} onChange={handleChange} />
          <TextField select label="Availability" name="availability" value={form.availability} onChange={handleChange}>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="on-bench">On Bench</MenuItem>
            <MenuItem value="not-available">Not Available</MenuItem>
          </TextField>
          <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} multiline rows={2} />

          <Button component="label" variant="outlined">
            {file ? file.name : "Attach Resume (optional)"}
            <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} />
          </Button>

          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} fullWidth disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Add Employee"}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
}