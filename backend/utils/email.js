// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE_HOST,
  port: process.env.EMAIL_SERVICE_PORT,
  secure: process.env.EMAIL_SERVICE_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Modified sendEmail to accept an 'attachments' array
const sendEmail = async (to, subject, text, html, attachments = []) => { // Added attachments parameter with default empty array
  try {
    const mailOptions = {
      from: `Event Management App <${process.env.EMAIL_AUTH_USER}>`,
      to: "22311a0563@cse.sreenidhi.edu.in",
      subject,
      text,
      html,
      attachments: attachments, // Assign the attachments array here
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;