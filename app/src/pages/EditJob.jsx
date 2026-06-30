// frontend/src/pages/EditJob.jsx
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  FormControlLabel,
  Checkbox,
  Divider,
  LinearProgress,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Tiptap from "./TipTap";
import GoBackButton from "../GoBack";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: "",
    clearanceLevel: "None",
    department: "",
    location: "",
    status: "published",
    screeningQuestions: [],
    applicationDeadline: "",
  });

  // Fetch job on mount
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const job = res.data;
        console.log("job is ", job);
        
        setFormData({
          title: job.title || "",
          description: job.description || "",
          skills: job.skills?.join(", ") || "",
          clearanceLevel: job.clearanceLevel || "None",
          department: job.department || "",
          location: job.location || "",
          status: job.status || "published",
          screeningQuestions: job.screeningQuestions || [],
          applicationDeadline: job.applicationDeadline || "",
        });
      } catch (err) {
        setError("Failed to load job or you don’t have permission");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      };

      await axios.put(`${API_URL}/api/jobs/${jobId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionChange = (html) => {
    setFormData((prev) => ({ ...prev, description: html }));
  };

  // Screening Questions Helpers
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      screeningQuestions: [
        ...prev.screeningQuestions,
        { question: "", type: "text", options: [], required: false },
      ],
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.screeningQuestions];
      updated[index][field] = value;
      if (field === "type" && value !== "multipleChoice") {
        updated[index].options = [];
      }
      return { ...prev, screeningQuestions: updated };
    });
  };

  const addOption = (qIndex) => {
    setFormData((prev) => {
      const updated = [...prev.screeningQuestions];
      updated[qIndex].options.push("");
      return { ...prev, screeningQuestions: updated };
    });
  };

  const updateOption = (qIndex, oIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.screeningQuestions];
      updated[qIndex].options[oIndex] = value;
      return { ...prev, screeningQuestions: updated };
    });
  };

  const removeOption = (qIndex, oIndex) => {
    setFormData((prev) => {
      const updated = [...prev.screeningQuestions];
      updated[qIndex].options.splice(oIndex, 1);
      return { ...prev, screeningQuestions: updated };
    });
  };

  const removeQuestion = (index) => {
    setFormData((prev) => {
      const updated = prev.screeningQuestions.filter((_, i) => i !== index);
      return { ...prev, screeningQuestions: updated };
    });
  };

  if (loading) {
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading job details...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      {/* <GoBackButton label="Back to Dashboard" fallback="/dashboard" /> */}

      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        Edit Job Posting
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Job updated successfully!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Job Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          margin="normal"
          required
        />

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          Job Description
        </Typography>
        <Tiptap
          value={formData.description}
          onChange={handleDescriptionChange}
        />
        <input type="hidden" value={formData.description} />

        <TextField
          fullWidth
          label="Required Skills (comma-separated)"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          margin="normal"
          placeholder="React, Node.js, AWS, Docker"
          helperText="e.g., React, TypeScript, MongoDB"
          required
        />

        <TextField
          fullWidth
          label="Department"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          margin="normal"
        />

        <TextField
          fullWidth
          label="Location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          margin="normal"
          placeholder="e.g., Bangalore, Remote, USA"
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Application Deadline (optional)"
            value={
              formData.applicationDeadline
                ? dayjs(formData.applicationDeadline)
                : null
            }
            onChange={(newValue) =>
              setFormData({
                ...formData,
                applicationDeadline: newValue ? newValue.toISOString() : "",
              })
            }
            slotProps={{
              textField: {
                fullWidth: true,
                margin: "normal",
                placeholder: "Select Application Deadline",
              },
            }}
          />
        </LocalizationProvider>

        {/* Screening Questions Section */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Screening Questions
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addQuestion}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Add Question
        </Button>

        {formData.screeningQuestions.map((q, qIndex) => (
          <Box
            key={qIndex}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: 3,
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1">Question {qIndex + 1}</Typography>
              <IconButton onClick={() => removeQuestion(qIndex)} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              label="Question"
              value={q.question}
              onChange={(e) =>
                updateQuestion(qIndex, "question", e.target.value)
              }
              margin="normal"
              required
            />

            <TextField
              select
              fullWidth
              label="Type"
              value={q.type}
              onChange={(e) => updateQuestion(qIndex, "type", e.target.value)}
              margin="normal"
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="multipleChoice">Multiple Choice</MenuItem>
            </TextField>

            {q.type === "multipleChoice" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Options
                </Typography>
                {q.options.map((opt, oIndex) => (
                  <Box key={oIndex} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      value={opt}
                      onChange={(e) =>
                        updateOption(qIndex, oIndex, e.target.value)
                      }
                      placeholder="Option text"
                    />
                    <IconButton
                      onClick={() => removeOption(qIndex, oIndex)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addOption(qIndex)}
                  size="small"
                >
                  Add Option
                </Button>
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={q.required}
                  onChange={(e) =>
                    updateQuestion(qIndex, "required", e.target.checked)
                  }
                />
              }
              label="Required"
            />
          </Box>
        ))}

        <TextField
          select
          fullWidth
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          margin="normal"
        >
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>

        <Box sx={{ mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving || success}
            sx={{ py: 1.8, borderRadius: 3 }}
          >
            {saving ? "Saving Changes..." : "Update Job"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
