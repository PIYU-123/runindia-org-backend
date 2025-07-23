// routes/customFormRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");
const customFormController = require("../controllers/customFormController");

// Create a new custom form
router.post("/", authenticate, allowRoles("organizer"), customFormController.createForm);

// Edit/update a custom form by ID
router.put("/:formId", authenticate, allowRoles("organizer"), customFormController.updateForm);

// Delete a custom form by ID
router.delete("/:formId", authenticate, allowRoles("organizer"), customFormController.deleteForm);

module.exports = router;
