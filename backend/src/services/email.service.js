const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

exports.sendVerificationEmail = async (user, rawToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your CareerForge AI account',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to CareerForge AI, ${user.name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;">Verify Email</a>
        <p style="margin-top:16px;color:#666;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your CareerForge AI password',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Password Reset Requested</h2>
        <p>Click the button below to reset your password. This link is valid for 15 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;">Reset Password</a>
        <p style="margin-top:16px;color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
      </div>
    `,
  });
};
