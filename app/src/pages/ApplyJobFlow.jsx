// frontend/src/pages/ApplyJobFlow.jsx
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Description,
  Work,
  LocationOn,
  AttachMoney,
  People,
} from "@mui/icons-material";

const steps = ["Job Details", "Quick Questions", "Upload Resume"];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// const API_URL = "http://localhost:5000";

export default function ApplyJobFlow() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  // Standard quick answers + dynamic screening answers
  const [answers, setAnswers] = useState({
    coverLetter: "",
    expectedSalary: "",
    availability: "",
    screening: {}, // Will hold { 0: "answer", 1: ["option1"], ... }
  });

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch job with screening questions
  useEffect(() => {
    axios
      .get(`${API_URL}/api/jobs/public/${jobId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        setJob(res.data);

        // Initialize screening answers
        const screeningInit = {};
        res.data.screeningQuestions?.forEach((_, index) => {
          screeningInit[index] = ""; // default empty
        });
        setAnswers((prev) => ({ ...prev, screening: screeningInit }));
      })
      .catch(() => setError("Job not found"))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate required screening questions
      const missing = job?.screeningQuestions?.some((q, i) => {
        const ans = answers.screening[i];
        return q.required && (!ans || (Array.isArray(ans) && ans.length === 0));
      });

      if (missing) {
        setError("Please answer all required questions");
        return;
      }
    }
    setError("");
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(droppedFile.type)
    ) {
      setFile(droppedFile);
    }
  };

  const handleScreeningChange = (index, value) => {
    setAnswers((prev) => ({
      ...prev,
      screening: { ...prev.screening, [index]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!file) return setError("Please upload your resume");

    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("coverLetter", answers.coverLetter);
    formData.append("expectedSalary", answers.expectedSalary);
    formData.append("availability", answers.availability);

    // Send screening answers as JSON string
    if (job?.screeningQuestions?.length > 0) {
      const screeningAnswers = job.screeningQuestions.map((q, i) => ({
        question: q.question,
        answer: answers.screening[i] || "",
      }));
      formData.append("screeningAnswers", JSON.stringify(screeningAnswers));
    }

    try {
      console.log("inside applying for a job");
      console.log("job Id is", jobId);
      await axios.post(`${API_URL}/api/applications/${jobId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate("/my-applications"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply");
      console.log();
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LinearProgress />;
  if (!job) return <Alert severity="error">Job not found</Alert>;
  console.log("job is", job)

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
      onClick={() => navigate(-1)}
    >
      <Container maxWidth="md" sx={{ mt: 6, mb: 8 }}>
        <Paper
          elevation={12}
          sx={{ borderRadius: 4, overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              Apply for this Position
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, opacity: 0.9 }}>
              {job.title}
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 1: Job Details */}
            {activeStep === 0 && (
              <Box>
                <Typography
                  variant="h5"
                  gutterBottom
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Work /> {job.title}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <LocationOn fontSize="small" /> {job.location || "Remote"} •{" "}
                  {job.department}
                </Typography>
                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Required Skills
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {job.skills?.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Job Description
                  </Typography>
                  <Box
                    sx={{ lineHeight: 1.8, color: "#374151" }}
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </Box>

                <Box sx={{ textAlign: "right", mt: 4 }}>
                  <Button variant="contained" size="large" onClick={handleNext}>
                    Continue to Application
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 2: Quick Questions + Screening Questions */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Help us know you better
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Cover Letter / Why you're a great fit (Optional)"
                  value={answers.coverLetter}
                  onChange={(e) =>
                    setAnswers({ ...answers, coverLetter: e.target.value })
                  }
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Expected Salary (Annual)"
                  placeholder="e.g., ₹15,00,000 or $80,000"
                  value={answers.expectedSalary}
                  onChange={(e) =>
                    setAnswers({ ...answers, expectedSalary: e.target.value })
                  }
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="When can you start?"
                  placeholder="e.g., Immediately, 2 weeks, 1 month"
                  value={answers.availability}
                  onChange={(e) =>
                    setAnswers({ ...answers, availability: e.target.value })
                  }
                  sx={{ mb: 4 }}
                />

                {/* Custom Screening Questions */}
                {job.screeningQuestions &&
                  job.screeningQuestions.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Screening Questions
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        {job.screeningQuestions.map((q, index) => (
                          <Box key={index} sx={{ mb: 4 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="600"
                              gutterBottom
                            >
                              {q.question}
                              {q.required && (
                                <span style={{ color: "red" }}> *</span>
                              )}
                            </Typography>

                            {/* Text */}
                            {q.type === "text" && (
                              <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={answers.screening[index] || ""}
                                onChange={(e) =>
                                  handleScreeningChange(index, e.target.value)
                                }
                              />
                            )}

                            {/* Yes/No */}
                            {q.type === "yes-no" && (
                              <RadioGroup
                                value={answers.screening[index] || ""}
                                onChange={(e) =>
                                  handleScreeningChange(index, e.target.value)
                                }
                              >
                                <FormControlLabel
                                  value="yes"
                                  control={<Radio />}
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="no"
                                  control={<Radio />}
                                  label="No"
                                />
                              </RadioGroup>
                            )}

                            {/* Multiple Choice */}
                            {q.type === "multiple-choice" && (
                              <Box>
                                {q.options.map((opt, oIdx) => (
                                  <FormControlLabel
                                    key={oIdx}
                                    control={
                                      <Checkbox
                                        checked={
                                          Array.isArray(
                                            answers.screening[index],
                                          )
                                            ? answers.screening[index].includes(
                                                opt,
                                              )
                                            : false
                                        }
                                        onChange={(e) => {
                                          const current =
                                            answers.screening[index] || [];
                                          if (e.target.checked) {
                                            handleScreeningChange(index, [
                                              ...current,
                                              opt,
                                            ]);
                                          } else {
                                            handleScreeningChange(
                                              index,
                                              current.filter((v) => v !== opt),
                                            );
                                          }
                                        }}
                                      />
                                    }
                                    label={opt}
                                  />
                                ))}
                              </Box>
                            )}

                            {/* Salary */}
                            {q.type === "salary" && (
                              <TextField
                                fullWidth
                                type="number"
                                value={answers.screening[index] || ""}
                                onChange={(e) =>
                                  handleScreeningChange(index, e.target.value)
                                }
                                placeholder="e.g. 1200000"
                                InputProps={{
                                  startAdornment: (
                                    <Typography sx={{ mr: 1 }}>₹</Typography>
                                  ),
                                }}
                              />
                            )}

                            {/* Number */}
                            {q.type === "number" && (
                              <TextField
                                fullWidth
                                type="number"
                                value={answers.screening[index] || ""}
                                onChange={(e) =>
                                  handleScreeningChange(index, e.target.value)
                                }
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Button onClick={handleBack}>Back</Button>
                  <Button variant="contained" size="large" onClick={handleNext}>
                    Continue to Upload Resume
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Upload Resume (unchanged) */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Final Step: Upload Your Resume
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Make sure your resume is up-to-date.
                </Typography>

                {success && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Applied successfully! Redirecting...
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  sx={{
                    border: "3px dashed #ccc",
                    borderRadius: 3,
                    p: 6,
                    textAlign: "center",
                    bgcolor: file ? "#f0fdf4" : "#fafafa",
                    borderColor: file ? "#22c55e" : "#ccc",
                    transition: "all 0.3s",
                  }}
                  onClick={() =>
                    document.getElementById("resume-input").click()
                  }
                >
                  {file ? (
                    <Typography variant="h6" color="success.main">
                      Selected: {file.name}
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="h6">
                        Drop your resume here
                      </Typography>
                      <Typography color="text.secondary">
                        or click to browse (PDF, DOC, DOCX)
                      </Typography>
                    </>
                  )}
                </Box>

                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) =>
                    e.target.files[0] && setFile(e.target.files[0])
                  }
                />

                {uploading && <LinearProgress sx={{ mt: 3 }} />}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Button onClick={handleBack}>Back</Button>
                  <Button
                    variant="contained"
                    size="large"
                    color="success"
                    onClick={handleSubmit}
                    disabled={!file || uploading || success}
                  >
                    {uploading ? "Submitting..." : "Submit Application"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
