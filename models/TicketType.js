const mongoose = require("mongoose");

const ticketTypeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ["general", "vip", "early_bird", "group"],
    default: "general"
  },
  pricing: {
    basePrice: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    fees: {
      serviceFee: { type: Number, default: 0 },
      processingFee: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 }
    },
    totalPrice: { type: Number },
    tierPricing: [
      {
        tier: Number,
        price: Number,
        quantity: Number,
        sold: { type: Number, default: 0 }
      }
    ]
  },
  availability: {
    totalQuantity: { type: Number, required: true },
    soldQuantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    availableQuantity: { type: Number },
    salesStart: { type: Date },
    salesEnd: { type: Date },
    unlimitedQuantity: { type: Boolean, default: false }
  },
  restrictions: {
    minQuantity: { type: Number, default: 1 },
    maxQuantity: { type: Number, default: 10 },
    requiresApproval: { type: Boolean, default: false },
    hiddenUntilDate: { type: Date, default: null }
  },
  benefits: [String],
  customFields: [
  {
    name: { type: String },
    type: { type: String },
    options: [String],
    required: { type: Boolean }
  }
],
  status: {
    type: String,
    enum: ["active", "paused", "sold_out", "cancelled"],
    default: "active"
  },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TicketType", ticketTypeSchema);
