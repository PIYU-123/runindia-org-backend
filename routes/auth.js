const express = require("express");
const router = express.Router();
const upload = require("../config/storage");       // multer config for file uploads
const uploads = require("../config/uploads");
const authController = require("../controllers/authController");

// Registration route (Organizer)
router.post(
  "/register",
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  authController.registerOrganizer
);

// Email verification route (OTP verification)
router.post("/verify", authController.verifyOtp);

// Login route
router.post("/login", authController.login);

router.post("/verify-login-otp", authController.verifyLoginOtp);

// Forgot password route (request OTP)
router.post("/forgot-password", authController.forgotPassword);

// Reset password route (using OTP)
router.post("/reset-password", authController.resetPassword);

// KYC document upload route (protected route in real scenario, here open for simplicity)
router.post("/organizer/kyc", upload.array("documents"), authController.uploadKYC);

module.exports = router;
