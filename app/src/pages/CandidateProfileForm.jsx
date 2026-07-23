// frontend/src/pages/CandidateProfileForm.jsx
import { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  LinearProgress,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import GoBackButton from "../GoBack";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CandidateProfileForm({ user }) {
  const [formData, setFormData] = useState({
    name: user?.name || "", // Pre-fill from login
    currentLocation: "",
    targetJobTitle: "",
    skills: "",
    preferredLocation: "",
    noticePeriod: "",
    experience: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // append text fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // append image
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      console.log("formdata to send", formDataToSend);

      await axios.post(`${API_URL}/api/candidate/profile`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/jobs";
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  console.log("image file is ", imageFile);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      {/* <GoBackButton/> */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
          Welcome to ATS!
        </Typography>
        <Typography variant="h5" gutterBottom>
          Complete Your Profile
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Just a quick setup to get you started with job applications.
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile saved! Redirecting to jobs...
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: 1,
        }}
      >
        {/* upload image */}
        <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
          Upload Profile Picture
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </Button>
        <TextField
          fullWidth
          label="Full Name "
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
          disabled={!!user?.name} // If pre-filled, disable
        />

        <TextField
          fullWidth
          label="Current Location "
          name="currentLocation"
          value={formData.currentLocation}
          onChange={handleChange}
          margin="normal"
          placeholder="e.g., Bangalore, India"
          required
        />

        <TextField
          fullWidth
          label="Job Title You're Looking For "
          name="targetJobTitle"
          value={formData.targetJobTitle}
          onChange={handleChange}
          margin="normal"
          placeholder="e.g., Senior Frontend Developer"
          required
        />

        <TextField
          fullWidth
          label="Skills (comma-separated) "
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          margin="normal"
          placeholder="React, JavaScript, Node.js, AWS"
          helperText="e.g., React, Node.js, Python"
          required
        />

        <TextField
          fullWidth
          label="Preferred Location "
          name="preferredLocation"
          value={formData.preferredLocation}
          onChange={handleChange}
          margin="normal"
          placeholder="e.g., Remote, Mumbai, or USA"
          required
        />

        <TextField
          fullWidth
          label="Notice Period (days) "
          name="noticePeriod"
          type="number"
          value={formData.noticePeriod}
          onChange={handleChange}
          margin="normal"
          InputProps={{ inputProps: { min: 0, max: 180 } }}
          placeholder="e.g., 30"
          required
        />

        <TextField
          fullWidth
          label="Total Experience (years) "
          name="experience"
          type="number"
          value={formData.experience}
          onChange={handleChange}
          margin="normal"
          InputProps={{ inputProps: { min: 0, max: 50 } }}
          placeholder="e.g., 5"
          required
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 4, py: 1.5, borderRadius: 2 }}
          disabled={loading || success}
        >
          {loading ? "Saving..." : "Save Profile & Start Applying"}
        </Button>
      </Box>
    </Container>
  );
}
