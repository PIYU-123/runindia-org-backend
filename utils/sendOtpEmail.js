const transporter = require("../config/mailer");

const sendOtpEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"RunIndia Auth" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your RunIndia Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #007bff;">👋 Hello ${name},</h2>
        <p>Thank you for verifying your email with <strong>RunIndia</strong>.</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size: 28px; font-weight: bold; background: #f9f9f9; padding: 12px; text-align: center; border-radius: 5px;">
          ${otp}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>. Please do not share it with anyone.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <br>
        <p style="font-size: 12px; color: #888;">Regards,<br><strong>RunIndia Team</strong></p>
      </div>
    `
  };
  // Send the email using the configured transporter
  await transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;
