// src/pages/AuthPage.jsx
import { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  Link,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, User, Briefcase } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthPage() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateRegister = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Must contain at least one letter and one number";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isLogin && !validateRegister()) return;
    setLoading(true);
    const url = isLogin ? "/api/login" : "/api/register";
    try {
      const res = await axios.post(`${API_URL}${url}`, {
        ...formData,
        email: formData.email.toLowerCase().trim(),
      });
      login(res.data.token, res.data.user);
      window.location.href = "/";
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isLogin ? "Invalid credentials" : "Registration failed")
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError("");
    setFieldErrors({ name: "", email: "", password: "" });
    setFormData({ name: "", email: "", password: "", role: "candidate" });
    setShowPassword(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #ede9fe 100%)",
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          {/* Logo / Brand */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight="800"
              sx={{
                background: "linear-gradient(120deg, #4f46e5, #0d9488)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                letterSpacing: "-0.5px",
                mb: 0.5,
              }}
            >
              Prixgen
            </Typography>
          </Box>

          {/* Tab-style toggle */}
          <Box
            sx={{
              display: "flex",
              mb: 3,
              p: 0.5,
              borderRadius: 2,
              backgroundColor: "action.hover",
            }}
          >
            {["Sign in", "Sign up"].map((label, i) => {
              const active = isLogin === (i === 0);
              return (
                <Box
                  key={label}
                  onClick={() => switchMode(i === 0)}
                  sx={{
                    flex: 1,
                    py: 1,
                    textAlign: "center",
                    borderRadius: 1.5,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? "text.primary" : "text.secondary",
                    backgroundColor: active ? "background.paper" : "transparent",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.2s ease",
                    userSelect: "none",
                  }}
                >
                  {label}
                </Box>
              );
            })}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Name — register only */}
            {!isLogin && (
              <TextField
                fullWidth
                label="Full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                autoFocus
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={18} color="var(--mui-palette-text-secondary, #6b7280)" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus={isLogin}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} color="var(--mui-palette-text-secondary, #6b7280)" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              error={!!fieldErrors.password}
              helperText={
                fieldErrors.password ||
                (!isLogin ? "Min 8 characters, include a letter and number" : "")
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} color="var(--mui-palette-text-secondary, #6b7280)" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Role — register only */}
            {!isLogin && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                  startAdornment={
                    <InputAdornment position="start">
                      <Briefcase size={18} color="var(--mui-palette-text-secondary, #6b7280)" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="candidate">Candidate</MenuItem>
                  <MenuItem value="hiring_manager">Hiring Manager</MenuItem>
                  <MenuItem value="interviewer">Interviewer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 2.5,
                py: 1.4,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: 15,
                textTransform: "none",
                background: "linear-gradient(120deg, #0f2a4a, #2c5282)",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(120deg, #0f2a4a, #2c5282)",
                  boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
                },
                "&:disabled": {
                  opacity: 0.7,
                },
              }}
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : isLogin
                ? "Sign in"
                : "Create account"}
            </Button>
          </Box>

          {/* Google + divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              or continue with
            </Typography>
          </Divider>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const { data } = await axios.post(`${API_URL}/api/auth/google`, {
                    credential: credentialResponse.credential,
                  });
                  login(data.token, data.user);
                  window.location.href = "/";
                } catch (err) {
                  setError(err.response?.data?.message || "Google login failed");
                }
              }}
              onError={() => setError("Google login failed")}
              theme="outline"
              size="large"
              text={isLogin ? "signin_with" : "signup_with"}
              shape="rectangular"
              width="340"
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}