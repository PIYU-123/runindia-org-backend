const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    avatar: { type: String },         // URL or path to profile photo
    dateOfBirth: { type: Date },
    preferences: {
      newsletter: { type: Boolean, default: false },
      eventReminders: { type: Boolean, default: false },
      promotionalEmails: { type: Boolean, default: false }
    }
  },
  auth: {
    provider: { type: String, default: "email" },  // e.g., email, google, facebook
    providerId: { type: String },                  // e.g., email address or OAuth ID
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date }
  },
  address: {                                      // User's address
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  roles: [{ type: String, enum: ["user", "organizer", "admin"] }],
  status: { type: String, enum: ["pending", "active", "suspended", "deleted"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
