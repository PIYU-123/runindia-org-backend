const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authenticate } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/upload");

// -----------------------------
// 🔹 Event Routes
// -----------------------------

// Create Event
router.post(
  "/create",
  authenticate,
  allowRoles("organizer"),
  upload.array("images"),
  eventController.createEvent
);

// Update Event
router.put(
  "/:eventId/edit",
  authenticate,
  allowRoles("organizer"),
  upload.array("images"),
  eventController.updateEventByOrganizer
);

// Soft Delete (status change)
router.patch(
  "/:id/status",
  authenticate,
  allowRoles("organizer"),
  eventController.deleteEventByOrganizer
);

// -----------------------------
// 🔹 Ticket Routes
// -----------------------------

// Create Ticket Type
router.post(
  "/:eventId/tickets",
  authenticate,
  allowRoles("organizer"),
  upload.none(), // accept text fields only
  eventController.createTicketType
);

// Update Ticket Type
router.put(
  "/:eventId/tickets/:ticketId",
  authenticate,
  allowRoles("organizer"),
  upload.none(), // fix: to parse multipart/form-data text fields
  eventController.updateTicketType
);

// Delete Ticket Type (soft delete by status)
router.delete(
  "/:eventId/tickets/:ticketId",
  authenticate,
  allowRoles("organizer"),
  eventController.deleteTicketType
);

module.exports = router;
