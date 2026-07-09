// src/pages/ShareQR.jsx
import { useState } from "react";
import { Container, Paper, Typography, Box, Button, TextField, Stack, Snackbar } from "@mui/material";
import { Copy, Download, Printer } from "lucide-react";

export default function ShareQR() {
  const [copied, setCopied] = useState(false);

  // The public, no-login resume upload page
  const uploadUrl = `${window.location.origin}/`;

  // Free QR generation API — no npm install required
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(uploadUrl)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
  };

  const handleDownload = async () => {
    const res = await fetch(qrImageUrl);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resume-upload-qr.png";
    link.click();
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head><title>Apply via QR Code</title></head>
        <body style="text-align:center; font-family: sans-serif; padding: 40px;">
          <h2>Scan to submit your resume</h2>
          <img src="${qrImageUrl}" style="width:400px;height:400px;" />
          <p>${uploadUrl}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Candidate Application QR Code
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Candidates scan this to open the resume upload page — no login needed.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <img src={qrImageUrl} alt="Resume upload QR code" style={{ width: 260, height: 260 }} />
        </Box>

        <TextField
          fullWidth
          value={uploadUrl}
          InputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
        />

        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="outlined" startIcon={<Copy size={16} />} onClick={handleCopy}>
            Copy Link
          </Button>
          <Button variant="outlined" startIcon={<Download size={16} />} onClick={handleDownload}>
            Download
          </Button>
          <Button variant="contained" startIcon={<Printer size={16} />} onClick={handlePrint}>
            Print
          </Button>
        </Stack>

        <Snackbar
          open={copied}
          autoHideDuration={2000}
          onClose={() => setCopied(false)}
          message="Link copied to clipboard"
        />
      </Paper>
    </Container>
  );
}