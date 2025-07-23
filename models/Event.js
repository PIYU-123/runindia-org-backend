const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "Organizer", required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // 👈 This is enough
  description: { type: String },
  shortDescription: { type: String },
  images: [
    {
      url: { type: String },
      alt: { type: String },
      isPrimary: { type: Boolean, default: false }
    }
  ],
  dates: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    saleStartDate: { type: Date },
    saleEndDate: { type: Date },
    timezone: { type: String }
  },
  location: {
    name: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String }
    },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] } // [longitude, latitude]
    },
    venue: {
      name: { type: String },
      capacity: { type: Number },
      amenities: [{ type: String }]
    }
  },
  categories: [{ type: String }],
  tags: [{ type: String }],
  ageRestrictions: {
    minAge: { type: Number },
    maxAge: { type: Number },
    requiresGuardian: { type: Boolean }
  },
  settings: {
    visibility: { type: String, enum: ["public", "private", "unlisted"], default: "public" },
    requiresApproval: { type: Boolean, default: false },
    maxTicketsPerUser: { type: Number },
    transferable: { type: Boolean },
    refundable: { type: Boolean },
    cancellationPolicy: { type: String }
  },
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }]
  },
  organizer: {
    name: { type: String },
    logo: { type: String },
    slug: { type: String }
  },
  stats: {
    totalTickets: { type: Number, default: 0 },
    soldTickets: { type: Number, default: 0 },
    availableTickets: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ["draft", "active", "cancelled", "completed", "suspended"],
    default: "draft"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Remove this to avoid duplicate index warning
// eventSchema.index({ slug: 1 }, { unique: true });

eventSchema.index({ organizerId: 1 });
eventSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Event", eventSchema);
