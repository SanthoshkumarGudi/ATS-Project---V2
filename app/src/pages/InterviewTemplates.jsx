// src/pages/InterviewTemplates.jsx
import { useEffect, useState } from "react";
import {
  Box, Container, Typography, Button, Paper, Stack, Chip, TextField,
  Modal, CircularProgress, IconButton, Alert,
} from "@mui/material";
import { Plus, Pencil, Trash2 } from "lucide-react";
import axios from "../utils/api";
import { colors } from "../theme/dashboardColors";

const ROUND_OPTIONS = [
  { value: "hr", label: "HR Round" },
  { value: "tech", label: "Technical Round" },
  { value: "manager", label: "Manager Round" },
];
const ROUND_LABELS = Object.fromEntries(ROUND_OPTIONS.map((r) => [r.value, r.label]));

function TemplateFormModal({ open, onClose, onSuccess, editingTemplate }) {
  const [name, setName] = useState("");
  const [rounds, setRounds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(editingTemplate?.name || "");
      setRounds(editingTemplate?.rounds || []);
      setError("");
    }
  }, [open, editingTemplate]);

  const addRound = (value) => setRounds((prev) => [...prev, value]);
  const removeRound = (index) => setRounds((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (rounds.length === 0) { setError("A template needs at least one round."); return; }
    setSaving(true);
    setError("");
    try {
      if (editingTemplate) {
        await axios.patch(`/interview-templates/${editingTemplate._id}`, { name, rounds });
      } else {
        await axios.post("/interview-templates", { name, rounds });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 3, width: { xs: "90%", sm: 480 }, mx: "auto", mt: "8%", boxShadow: 24 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          {editingTemplate ? "Edit Template" : "New Interview Template"}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField fullWidth label="Template Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 3 }} />

        <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Round Sequence (in order)</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 2, minHeight: 40 }}>
          {rounds.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No rounds added yet.</Typography>
          ) : rounds.map((r, i) => (
            <Chip
              key={i}
              label={`${i + 1}. ${ROUND_LABELS[r]}`}
              onDelete={() => removeRound(i)}
              sx={{ bgcolor: colors.tealLight, color: colors.tealDark, fontWeight: 700 }}
            />
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Click to append a round to the sequence — order matters, so click in the order you want them to run:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {ROUND_OPTIONS.map((opt) => (
            <Button key={opt.value} size="small" variant="outlined" startIcon={<Plus size={14} />} onClick={() => addRound(opt.value)}>
              {opt.label}
            </Button>
          ))}
        </Stack>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handleSave} fullWidth disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Save Template"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default function InterviewTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [error, setError] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/interview-templates");
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id) => {
    setError("");
    try {
      await axios.delete(`/interview-templates/${id}`);
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete template");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Interview Templates</Typography>
          <Typography color="text.secondary">Define which rounds apply, and in what order, for each hiring process.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setEditingTemplate(null); setModalOpen(true); }}>
          New Template
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>No templates yet — create one.</Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 3 }}>
          {templates.map((t) => (
            <Paper key={t._id} sx={{ p: 3, borderRadius: "14px" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography fontWeight={700}>{t.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.rounds.map((r) => ROUND_LABELS[r]).join(" → ")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => { setEditingTemplate(t); setModalOpen(true); }}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(t._id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchTemplates}
        editingTemplate={editingTemplate}
      />
    </Container>
  );
}