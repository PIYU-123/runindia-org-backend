const mongoose = require("mongoose");

const organizerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  organizationName: { type: String, required: true },
  slug: { type: String, unique: true },          // URL-friendly name for the organization
  description: { type: String },
  contactInfo: {
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    socialMedia: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String }
    }
  },
  address: {                                     // Organizer's address (could be same as user or different)
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  branding: {
    logo: { type: String },    // URL or path to logo image
    banner: { type: String },  // URL or path to banner image
    primaryColor: { type: String },
    secondaryColor: { type: String }
  },
  verification: {
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    verifiedAt: { type: Date },
    documents: [
      {
        type: { type: String },   // e.g., "business_license", "kyc"
        url: { type: String },    // path or URL to the document
        uploadedAt: { type: Date }
      }
    ]
  },
  bankingInfo: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String },
    paymentProcessorId: { type: String }  // e.g., Stripe account ID
  },
  settings: {
    autoApproveRefunds: { type: Boolean, default: false },
    defaultRefundPolicy: { type: String },       // e.g., "30_days"
    timezone: { type: String }
  },
  stats: {
    totalEvents: { type: Number, default: 0 },
    totalTicketsSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0.0 },
    averageRating: { type: Number, default: 0.0 }
  },
  status: { type: String, enum: ["pending", "active", "suspended", "deleted"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Useful indexes for performance
organizerSchema.index({ userId: 1 });
organizerSchema.index({ "verification.status": 1 });
organizerSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Organizer", organizerSchema);
