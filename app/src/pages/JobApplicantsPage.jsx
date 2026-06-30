// src/pages/JobApplicantsPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  Box,
  Chip,
  Avatar,
  Stack,
  Divider,
  Paper,
  CircularProgress,
  Button,
  Container,
  Modal,
  IconButton,
} from "@mui/material";
import {
  Download,
  Person,
  Close,
  CalendarToday,
  Visibility,
} from "@mui/icons-material";

import InterviewSchedulerModal from "../components/InterviewSchedulerModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function JobApplicantsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState(
    location.state?.jobTitle || "Job Applicants"
  );

  const [selectedApp, setSelectedApp] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isReschedule, setIsReschedule] = useState(false);

  // Resume Preview States
  const [previewResumeUrl, setPreviewResumeUrl] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_URL}/api/applications/job/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const applns = res.data;
        if (applns.length === 0) {
          setApplications([]);
          return;
        }

        const enrichedApps = await Promise.all(
          applns.map(async (app) => {
            try {
              const interviewRes = await axios.get(
                `${API_URL}/api/interviews/application/${app._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              return { ...app, interview: interviewRes.data };
            } catch (err) {
              return { ...app, interview: null };
            }
          })
        );

        setApplications(enrichedApps);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
        alert("Failed to load applicants");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchApplications();
    }
  }, [jobId]);

  const handleScheduleClick = (app, reschedule) => {
    setSelectedApp(app);
    setIsReschedule(reschedule);
    setShowScheduler(true);
  };

  console.log("selected app is ============================################", selectedApp);
  
  // Handle Resume Preview
  const handlePreviewResume = (url, app) => {
    if (!url) {
      alert("No resume available for preview.");
      return;
    }
    setPreviewResumeUrl(url);
    setSelectedApp(app);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewResumeUrl(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 3 }}>Loading Applications...</Typography>
      </Container>
    );
  }

  if (applications.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5">No Applications Found</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 3 }}>
          Go Back
        </Button>
      </Container>
    );
  }  

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={5}
      >
        <Typography variant="h4">
          Applicants for the job : <strong>{jobTitle}</strong>
        </Typography>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<Close />}
          variant="outlined"
        >
          Go Back
        </Button>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Stack spacing={4}>
        {applications.map((app) => {
          const jobSkills = app.job?.skills || [];
          const candidateSkills = app.parsedData?.skills || [];
          const matchedSkills = candidateSkills.filter((skill) =>
            jobSkills.some((js) => js.toLowerCase() === skill.toLowerCase())
          );
          const missingSkills = jobSkills.filter(
            (js) =>
              !candidateSkills.some(
                (cs) => cs.toLowerCase() === js.toLowerCase()
              )
          );
          console.log("job skills are", jobSkills);
          console.log("candidate skills are", candidateSkills);
          
          console.log("matched skills are", matchedSkills)
          console.log("missing skills are", missingSkills)

          return (
            <Paper
              key={app._id}
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                border: app.parsedData?.isShortlisted
                  ? "2px solid #4caf50"
                  : "1px solid #e0e0e0",
              }}
            >
              {/* Header */}
              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar sx={{ bgcolor: "#1976d2", width: 64, height: 64 }}>
                  <Person />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {app.parsedData?.name || "Unknown Candidate"}
                  </Typography>
                  <Typography color="text.secondary">
                    {app.parsedData?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applied on: {new Date(app.appliedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Chip
                    label={`${app.parsedData?.matchPercentage || 0}% Match`}
                    color={
                      app.parsedData?.matchPercentage >= 70
                        ? "success"
                        : "warning"
                    }
                    size="small"
                  />
                  {app.parsedData?.isShortlisted && (
                    <Chip
                      label="Shortlisted"
                      color="success"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Cover Letter, Expected Salary, Availability */}
              {app.coverLetter && (
                <Box mb={2}>
                  <Typography fontWeight="bold">Cover Letter:</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {app.coverLetter}
                  </Typography>
                </Box>
              )}

              {app.expectedSalary && (
                <Box mb={2}>
                  <Typography fontWeight="bold">Expected Salary:</Typography>
                  <Typography variant="body1">₹{app.expectedSalary}</Typography>
                </Box>
              )}

              {app.availability && (
                <Box mb={2}>
                  <Typography fontWeight="bold">Availability:</Typography>
                  <Typography variant="body1">{app.availability}</Typography>
                </Box>
              )}

              {/* Screening Questions */}
              {app.screeningAnswers && app.screeningAnswers.length > 0 && (
                <Box
                  mt={2}
                  mb={2}
                  p={2}
                  sx={{ bgcolor: "#f9f9f9", borderRadius: 2 }}
                >
                  <Typography fontWeight="bold" color="primary" gutterBottom>
                    Screening Questions
                  </Typography>
                  {app.screeningAnswers.map((qa) => (
                    <Box key={qa._id} mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Q: {qa.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        A: {qa.answer}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Skills Section */}
              <Box mt={2}>
                <Typography fontWeight="bold" gutterBottom>
                  Skills
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {matchedSkills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      // color="primary"
                      variant="contained"
                      sx={{ fontWeight: 600 ,
                        color:"InfoText",
                      }}
                    />
                  ))}
                  {missingSkills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      // color="error"
                      variant="outlined"
                      sx={{
                        border: "2px solid",
                        color:"InfoText",
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Interview Feedback Section - Safer Condition */}
              {Array.isArray(app.interview) &&
                app.interview.length > 0 &&
                app.interview[0]?.feedback && (
                  <Box mt={4}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="primary"
                      gutterBottom
                      sx={{ borderBottom: "2px solid #1976d2", pb: 1 }}
                    >
                      Interview Feedback ({app.interview.length} Round
                      {app.interview.length > 1 ? "s" : ""})
                    </Typography>
                    <Stack spacing={3}>
                      {app.interview
                        .sort((a, b) => a.round - b.round)
                        .map((interview) => {
                          const feedback = interview.feedback;
                          if (!feedback) return null;

                          const isHire = feedback.recommendation === "hire";
                          const isNext = feedback.recommendation === "next-round";
                          const isReject = feedback.recommendation === "reject";

                          return (
                            <Paper
                              key={interview._id}
                              elevation={3}
                              sx={{
                                p: 3,
                                borderRadius: 2,
                                borderLeft: isHire
                                  ? "5px solid #4caf50"
                                  : isNext
                                  ? "5px solid #4caf50"
                                  : isReject
                                  ? "5px solid #f44336"
                                  : "5px solid #9e9e9e",
                              }}
                            >
                              {/* Feedback Content - Same as before */}
                              <Stack spacing={2}>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    Round {interview.round} -{" "}
                                    {interview.interviewer?.name || "Interviewer"}
                                  </Typography>
                                  <Chip
                                    label={
                                      feedback.recommendation
                                        ?.replace("-", " ")
                                        .toUpperCase() || "PENDING"
                                    }
                                    size="small"
                                    color={
                                      isHire
                                        ? "success"
                                        : isNext
                                        ? "warning"
                                        : isReject
                                        ? "error"
                                        : "default"
                                    }
                                    sx={{ fontWeight: "bold" }}
                                  />
                                </Box>

                                {/* Salary & Notice Period */}
                                {(feedback.negotiatedSalary ||
                                  feedback.noticePeriod) && (
                                  <Stack
                                    direction="row"
                                    spacing={4}
                                    flexWrap="wrap"
                                    useFlexGap
                                  >
                                    {feedback.negotiatedSalary && (
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Typography
                                          variant="body2"
                                          fontWeight="600"
                                          color="text.secondary"
                                        >
                                          Negotiated Salary:
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          fontWeight="bold"
                                          color="success.main"
                                        >
                                          ₹
                                          {parseInt(
                                            feedback.negotiatedSalary
                                          ).toLocaleString("en-IN")}
                                        </Typography>
                                      </Box>
                                    )}
                                    {feedback.noticePeriod && (
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Typography
                                          variant="body2"
                                          fontWeight="600"
                                          color="text.secondary"
                                        >
                                          Notice Period:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                          {feedback.noticePeriod}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Stack>
                                )}

                                {/* Notes */}
                                {feedback.notes && (
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="600"
                                      color="text.secondary"
                                      gutterBottom
                                    >
                                      Interviewer Notes:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        bgcolor: "#f5f5f5",
                                        p: 2,
                                        borderRadius: 1,
                                        fontStyle: "italic",
                                        borderLeft: "4px solid #1976d2",
                                      }}
                                    >
                                      {feedback.notes}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Rating */}
                                {feedback.rating && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography
                                      variant="body2"
                                      fontWeight="600"
                                      color="text.secondary"
                                    >
                                      Rating:
                                    </Typography>
                                    <Box>
                                      {[...Array(5)].map((_, i) => (
                                        <span
                                          key={i}
                                          style={{
                                            color:
                                              i < feedback.rating
                                                ? "#ffb400"
                                                : "#e0e0e0",
                                          }}
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                              </Stack>
                            </Paper>
                          );
                        })}
                    </Stack>
                  </Box>
                )}

              {/* Schedule Buttons */}
              <Stack direction="row" spacing={2} mt={3} display="flex" alignItems='initial'>
              <Stack direction="row" spacing={2} mt={3} alignItems='initial'>
              {app.parsedData?.isShortlisted && (
                <Box mt={3} display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CalendarToday />}
                    onClick={() => handleScheduleClick(app, false)}
                  >
                    Schedule Interview
                  </Button>

                  {app.interview?.length > 0 &&
                    app.status !== "offered" &&
                    app.status !== "on-hold" &&
                    app.status !== "rejected" && (
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => handleScheduleClick(app, true)}
                      >
                        Re-schedule Interview
                      </Button>
                    )}
                </Box>
              )}
              </Stack>
              <Stack direction="row" spacing={2} mt={3} display="flex" alignItems='end'>
              {/* Resume Preview + Download Buttons */}
              <Box mt={4} display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => handlePreviewResume(app.resumeUrl, app)}
                  disabled={!app.resumeUrl}
                >
                  Preview Resume
                </Button>
              </Box>
              </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {/* Interview Scheduler Modal */}
      {selectedApp && (
        <InterviewSchedulerModal
          open={showScheduler}
          onClose={() => {
            setShowScheduler(false);
            setSelectedApp(null);
            setIsReschedule(false);
          }}
          application={selectedApp}
          reScheduleInterview={isReschedule}
        />
      )}

      {/* Resume Preview Modal */}
{/* Resume Preview Modal - Smooth Google Docs Viewer */}
<Modal
  open={showPreviewModal}
  onClose={handleClosePreview}
  closeAfterTransition
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: 2,
  }}
>
  <Box
    sx={{
      bgcolor: "background.paper",
      borderRadius: 3,
      boxShadow: 24,
      width: "95%",
      maxWidth: "1100px",
      height: "92vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    {/* Header */}
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2.5}
      borderBottom="1px solid #e0e0e0"
      bgcolor="#f8fafc"
    >
      <Typography variant="h6" fontWeight="200">
        Resume Preview - <strong>{selectedApp?.parsedData?.name || "Candidate"}</strong>
      </Typography>
      <IconButton onClick={handleClosePreview}>
        <Close />
      </IconButton>
    </Box>

    {/* Preview Area */}
    <Box flex={1} sx={{ overflow: "hidden", bgcolor: "#f1f5f9", position: "relative" }}>
      {previewResumeUrl ? (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(previewResumeUrl)}&embedded=true`}
          title="Resume Preview"
          width="100%"
          height="100%"
          style={{
            border: "none",
            minHeight: "800px",
          }}
          allowFullScreen
        />
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Typography color="text.secondary">Unable to load resume preview</Typography>
        </Box>
      )}
    </Box>

    {/* Footer Actions */}
    <Box
      p={2.5}
      borderTop="1px solid #e0e0e0"
      display="flex"
      justifyContent="flex-end"
      gap={2}
      bgcolor="#f8fafc"
    >
      <Button variant="outlined" onClick={handleClosePreview}>
        Close
      </Button>
      <Button
        variant="contained"
        startIcon={<Download />}
        href={previewResumeUrl}
        target="_blank"
      >
        Download Resume
      </Button>
    </Box>
  </Box>
</Modal>
    </Container>
  );
}