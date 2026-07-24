// backend/utils/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

const sendInterviewEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"ATS Pro" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};

module.exports = { sendInterviewEmail };
