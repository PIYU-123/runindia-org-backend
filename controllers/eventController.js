const Event = require("../models/Event");
const Organizer = require("../models/Organizer");
const TicketType = require("../models/TicketType");
const slugify = require("slugify");
const mongoose = require("mongoose");

exports.createEvent = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔒 1. Check User and Organizer status = "active"
    if (req.user.status !== "active") {
      return res.status(403).json({ message: "User account is not active." });
    }

    const organizer = await Organizer.findOne({ userId });
    if (!organizer || organizer.status !== "active") {
      return res.status(403).json({ message: "Organizer is not active." });
    }

    // 🧾 2. Extract & validate required fields
    const {
      title,
      slug: slugFromBody,
      description = "",
      shortDescription = "",
      dates: datesRaw,
      location: locationRaw,
      categories: categoriesRaw,
      tags: tagsRaw,
      ageRestrictions: ageRestrictionsRaw,
      settings: settingsRaw,
      seo: seoRaw,
      stats: statsRaw,
      status: statusRaw
    } = req.body;

    if (!title || !datesRaw) {
      return res.status(400).json({ message: "Title and dates are required." });
    }

    // ✅ 3. Parse JSON fields
    const safeParse = (input, fallback) => {
      try {
        return JSON.parse(input || fallback);
      } catch {
        return fallback ? JSON.parse(fallback) : null;
      }
    };

    const dates = safeParse(datesRaw, "{}");
    const location = safeParse(locationRaw, "{}");
    const categories = safeParse(categoriesRaw, "[]");
    const tags = safeParse(tagsRaw, "[]");
    const ageRestrictions = safeParse(ageRestrictionsRaw, "{}");
    const settings = safeParse(settingsRaw, "{}");
    const seo = safeParse(seoRaw, "{}");
    const stats = safeParse(statsRaw, "{}");

    // 🌍 Validate coordinates
    if (location?.coordinates?.type === "Point") {
      const coords = location.coordinates.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(n => typeof n === "number")) {
        location.coordinates.coordinates = [0, 0];
      }
    }

    // 🖼️ 4. Handle image uploads
    const images = [];
    if (req.files?.length) {
      req.files.forEach((file, index) => {
        images.push({
          url: `https://cdn.example.com/uploads/${file.filename}`,
          alt: file.originalname,
          isPrimary: index === 0
        });
      });
    }

    // 🏷️ 5. Slug generation
    const slug = slugFromBody
      ? slugify(slugFromBody, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    // 🧱 6. Construct Event Document
    const event = await Event.create({
      organizerId: organizer._id,
      title,
      slug,
      description,
      shortDescription,
      images,
      dates,
      location,
      categories,
      tags,
      ageRestrictions,
      settings,
      seo,
      stats,
      status: statusRaw || "draft",
      organizer: {
        name: organizer.organizationName,
        logo: organizer.branding?.logo || "",
        slug: organizer.slug
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // ✅ 7. Return Success
    return res.status(201).json({ message: "Event created successfully", event });

  } catch (err) {
    console.error("❌ Error in createEvent:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};





//update event by organizer

// Utility to safely parse JSON-like fields
const parseField = (input, fallback = null) => {
  try {
    return typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return fallback;
  }
};
// List of fields that can be updated
const updatableFields = [
  "title", "slug", "description", "shortDescription",
  "dates", "location", "categories", "tags",
  "ageRestrictions", "settings", "seo", "status"
];

exports.updateEventByOrganizer = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    //Find the organizer associated with the user
    const organizer = await Organizer.findOne({ userId });
    if (!organizer) {
      return res.status(403).json({ message: "Organizer not found or not authorized." });
    }

    //Find the event owned by the organizer
    const event = await Event.findOne({ _id: eventId, organizerId: organizer._id });
    if (!event) {
      return res.status(404).json({ message: "Event not found or not authorized" });
    }

    //Update allowed fields
    if (req.body && typeof req.body === "object") {
      for (const field of updatableFields) {
        if (field in req.body) {
          const isJsonField = [
            "dates", "location", "categories", "tags",
            "ageRestrictions", "settings", "seo"
          ].includes(field);

          event[field] = isJsonField
            ? parseField(req.body[field])
            : req.body[field];
        }
      }
    }

    //Handle image updates
    if (Array.isArray(req.files) && req.files.length > 0) {
      event.images = req.files.map((file, index) => ({
        url: `https://cdn.example.com/uploads/${file.filename}`,
        alt: file.originalname,
        isPrimary: index === 0
      }));
    }

    event.updatedAt = new Date();
    await event.save();

    return res.status(200).json({ message: "Event updated successfully", event });

  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};




//delete event by organizer(soft delete)
exports.deleteEventByOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Get organizer from user
    const organizer = await Organizer.findOne({ userId });
    if (!organizer) {
      return res.status(403).json({ message: "Organizer not found or not authorized." });
    }

    //Find the event owned by the organizer
    const event = await Event.findOne({ _id: id, organizerId: organizer._id });

    if (!event) {
      return res.status(404).json({ message: "Event not found or not authorized" });
    }

    if (event.status === "deleted") {
      return res.status(400).json({ message: "Event already deleted" });
    }

    event.status = "deleted";
    event.updatedAt = new Date();
    await event.save();

    return res.status(200).json({
      message: "Event soft-deleted successfully",
      eventId: event._id
    });

  } catch (error) {
    console.error(" Error during soft delete:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};




//create tickettype

exports.createTicketType = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Helper to safely parse JSON fields
    const parseJson = (val, fallback = {}) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val || fallback;
      } catch {
        return fallback;
      }
    };

    const parseArray = (val) => Array.isArray(val) ? val : parseJson(val, []);

    const {
      name,
      description = "",
      category = "general",
      status = "active",
      sortOrder = 0
    } = req.body;

    const pricing = parseJson(req.body.pricing);
    const availability = parseJson(req.body.availability);
    const restrictions = parseJson(req.body.restrictions);
    const benefits = parseArray(req.body.benefits);
    const customFields = parseArray(req.body.customFields);

    const errors = [];
    if (!name) errors.push("name is required");
    if (!pricing.basePrice) errors.push("pricing.basePrice is required");
    if (!availability.totalQuantity) errors.push("availability.totalQuantity is required");

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    pricing.currency = pricing.currency || "USD";
    pricing.totalPrice =
      pricing.basePrice +
      (pricing.fees?.serviceFee || 0) +
      (pricing.fees?.processingFee || 0) +
      (pricing.fees?.taxes || 0);

    availability.soldQuantity = availability.soldQuantity || 0;
    availability.reservedQuantity = availability.reservedQuantity || 0;
    availability.availableQuantity =
      availability.totalQuantity -
      availability.soldQuantity -
      availability.reservedQuantity;

    availability.unlimitedQuantity = availability.unlimitedQuantity || false;

    const ticket = new TicketType({
      eventId,
      name,
      description,
      category,
      pricing,
      availability,
      restrictions: {
        minQuantity: restrictions.minQuantity || 1,
        maxQuantity: restrictions.maxQuantity || 10,
        requiresApproval: restrictions.requiresApproval || false,
        hiddenUntilDate: restrictions.hiddenUntilDate || null,
      },
      benefits,
      customFields,
      status,
      sortOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const saved = await ticket.save();
    return res.status(201).json({
      success: true,
      message: "Ticket type created successfully",
      data: saved
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate entry",
        duplicate: err.keyValue
      });
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateTicketType = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid event or ticket ID format" });
    }

    const ticket = await TicketType.findOne({ _id: ticketId, eventId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket type not found for the event" });
    }

    const parse = (val, fallback = {}) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val || fallback;
      } catch {
        return fallback;
      }
    };

    const {
      name, description, category, status, sortOrder
    } = req.body;

    const pricing = parse(req.body.pricing);
    const availability = parse(req.body.availability);
    const restrictions = parse(req.body.restrictions);
    const benefits = parse(req.body.benefits, []);
    const customFields = parse(req.body.customFields, []);

    // Update fields
    if (name) ticket.name = name;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (status) ticket.status = status;
    if (sortOrder) ticket.sortOrder = sortOrder;

    if (pricing) {
      pricing.currency = pricing.currency || "USD";
      pricing.totalPrice =
        pricing.basePrice +
        (pricing.fees?.serviceFee || 0) +
        (pricing.fees?.processingFee || 0) +
        (pricing.fees?.taxes || 0);
      ticket.pricing = pricing;
    }

    if (availability) {
      availability.soldQuantity = availability.soldQuantity || 0;
      availability.reservedQuantity = availability.reservedQuantity || 0;
      availability.availableQuantity =
        availability.totalQuantity -
        availability.soldQuantity -
        availability.reservedQuantity;
      availability.unlimitedQuantity = availability.unlimitedQuantity || false;
      ticket.availability = availability;
    }

    if (restrictions) {
      ticket.restrictions = {
        minQuantity: restrictions.minQuantity || 1,
        maxQuantity: restrictions.maxQuantity || 10,
        requiresApproval: restrictions.requiresApproval || false,
        hiddenUntilDate: restrictions.hiddenUntilDate || null,
      };
    }

    ticket.benefits = benefits;
    ticket.customFields = customFields;

    ticket.updatedAt = new Date();
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket type updated successfully",
      data: ticket
    });
  } catch (err) {
    console.error("Update TicketType Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.deleteTicketType = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;

    const ticket = await TicketType.findOne({ _id: ticketId, eventId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket type not found" });
    }

    ticket.status = "cancelled";
    ticket.updatedAt = new Date();
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket type deleted (soft) successfully",
      ticketId
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
