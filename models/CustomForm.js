// models/CustomForm.js
const mongoose = require("mongoose");

// Schema for individual form fields
const fieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  type: { type: String, required: true }, // text, select, textarea, etc.
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [String], // for select, dropdown fields
  validation: {
    required: { type: Boolean },
    minLength: { type: Number },
    maxLength: { type: Number }
  }
}, { _id: false });

// Schema for form settings
const settingsSchema = new mongoose.Schema({
  showOnTicketPurchase: { type: Boolean, default: false },
  showOnRegistration: { type: Boolean, default: false },
  allowMultipleSubmissions: { type: Boolean, default: false }
}, { _id: false });

// Main CustomForm schema
const customFormSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizer",
    required: true
  },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["attendee_info", "registration", "survey"],
    required: true
  },
  description: { type: String },
  fields: [fieldSchema],
  settings: settingsSchema,
  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CustomForm", customFormSchema);
