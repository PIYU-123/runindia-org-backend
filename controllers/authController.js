const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const User = require("../models/User");
const Organizer = require("../models/Organizer");
const Otp = require("../models/Otp");
const generateToken = require("../utils/generateToken");
const sendOtpEmail = require("../utils/sendOtpEmail");

// Register a new organizer (user + organizer profile)
exports.registerOrganizer = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, password, dateOfBirth,
      organizationName, description,
      contactEmail, contactPhone,
      street, city, state, pincode, country,
      primaryColor, secondaryColor
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !organizationName || !contactEmail || !contactPhone || !street || !city || !state || !pincode || !country) {
      return res.status(400).json({ message: "Required fields missing." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists." });

    const avatar = req.files?.avatar?.[0]?.filename
      ? `https://cdn.example.com/uploads/${req.files.avatar[0].filename}`
      : null;
    const logo = req.files?.logo?.[0]?.filename
      ? `https://cdn.example.com/uploads/${req.files.logo[0].filename}`
      : null;
    const banner = req.files?.banner?.[0]?.filename
      ? `https://cdn.example.com/uploads/${req.files.banner[0].filename}`
      : null;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      profile: {
        firstName,
        lastName,
        phone,
        avatar,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      },
      address: { street, city, state, zipCode: pincode, country },
      auth: {
        provider: "email",
        providerId: email,
        passwordHash,
        emailVerified: false
      },
      roles: ["organizer"],
      status: "pending"
    });

    await Organizer.create({
      userId: user._id,
      organizationName,
      slug: slugify(organizationName, { lower: true }),
      description,
      contactInfo: {
        email: contactEmail,
        phone: contactPhone
      },
      address: { street, city, state, zipCode: pincode, country },
      branding: {
        logo,
        banner,
        primaryColor,
        secondaryColor
      },
      verification: { status: "pending" },
      status: "pending"
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email },
      { email, otp, expiresAt: new Date(Date.now() + 10 * 60000) },
      { upsert: true }
    );

    await sendOtpEmail(email, otp, firstName);

    return res.status(201).json({ message: "Registration successful. OTP sent to email." });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: err.message });
  }
};



// Verify email using OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Find OTP record for the email
    const record = await Otp.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: "OTP not found. Please register or request OTP again." });
    }
    // Check if OTP matches and is not expired
    if (record.otp !== otp || record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // OTP is valid. Update the user's emailVerified and status.
    const user = await User.findOneAndUpdate(
      { email: email },
      { 
        "auth.emailVerified": true, 
        status: "pending",              // Mark user as active now that email is verified
        updatedAt: Date.now()
      },
      { new: true }
    );
    // Optional: Also mark organizer as pending verified (already pending by default)

    // Remove used OTP records for this email
    await Otp.deleteMany({ email: email });

    // Generate a JWT token for the user to login immediately if needed
    const token = generateToken(user);
    return res.status(200).json({ message: "Email verified successfully.", token });
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Login with email and password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.auth.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    // ✅ Always generate a new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 min expiry

    await Otp.findOneAndUpdate(
      { email },
      { email, otp: otpCode, expiresAt },
      { upsert: true }
    );

    await sendOtpEmail(email, otpCode, user.profile?.firstName || "User");

    return res.status(200).json({
      message: "OTP sent. Please verify to complete login.",
      userId: user._id,
      email: user.email
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required." });

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    // ✅ Mark email as verified if not already
    if (!user.auth.emailVerified) user.auth.emailVerified = true;

    user.auth.lastLogin = new Date();
    user.auth.loginCount = (user.auth.loginCount || 0) + 1;
    await user.save();

    await Otp.deleteMany({ email }); // clear old OTPs

    const token = generateToken(user);

    return res.status(200).json({
      message: "OTP verified. Login complete.",
      token
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


// Forgot Password - Send OTP to email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Generate OTP and save (upsert in case one already exists)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000);
    await Otp.findOneAndUpdate(
      { email: email },
      { email: email, otp: otpCode, expiresAt: otpExpiry },
      { upsert: true, new: true }
    );

    // Send OTP email for password reset (using user's first name if available)
    const name = user.profile.firstName || "User";
    await sendOtpEmail(email, otpCode, name);

    return res.status(200).json({ message: "OTP sent to email for password reset." });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Reset Password using OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }

    // Verify OTP record
    const record = await Otp.findOne({ email });
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // OTP is valid, update the user's password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email: email },
      { "auth.passwordHash": passwordHash },
      { new: true }
    );

    // Remove OTP records for this email
    await Otp.deleteMany({ email: email });

    return res.status(200).json({ message: "Password reset successful. You can now log in with the new password." });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Upload KYC documents (for organizers)
exports.uploadKYC = async (req, res) => {
  try {
    const { userId } = req.body;
    const files = req.files;  // files uploaded via multer

    if (!userId || !files || files.length === 0) {
      return res.status(400).json({ message: "Missing userId or files." });
    }

    // Find organizer profile by userId
    const organizer = await Organizer.findOne({ userId: userId });
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found." });
    }

    // Build documents array from uploaded files
    const documents = files.map(file => ({
      type: "kyc",
      url: `/uploads/kyc/${file.filename}`,   // path where file is accessible
      uploadedAt: new Date()
    }));

    // Append new documents to organizer's verification documents
    organizer.verification.documents.push(...documents);
    // (Optionally, could update verification status or notify admin here)
    await organizer.save();

    return res.status(200).json({ message: "KYC documents uploaded successfully.", documents });
  } catch (err) {
    console.error("Error in uploadKYC:", err);
    return res.status(500).json({ message: err.message });
  }
};
