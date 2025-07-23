const mongoose = require("mongoose");
const CustomForm = require("../models/CustomForm");

exports.createForm = async (req, res) => {
  try {
    const {
      eventId,
      organizerId,
      name,
      type,
      description,
      fields,
      settings,
      status
    } = req.body;

    if (!eventId || !organizerId || !name || !type || !fields || !settings) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newForm = new CustomForm({
      eventId,
      organizerId,
      name,
      type,
      description,
      fields: JSON.parse(fields),
      settings: JSON.parse(settings),
      status: status || "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newForm.save();
    return res.status(201).json({ message: "Form created successfully", form: newForm });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const updates = req.body;

    if (updates.fields) updates.fields = JSON.parse(updates.fields);
    if (updates.settings) updates.settings = JSON.parse(updates.settings);

    const form = await CustomForm.findByIdAndUpdate(
      formId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!form) return res.status(404).json({ message: "Form not found" });

    return res.status(200).json({ message: "Form updated successfully", form });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await CustomForm.findByIdAndDelete(formId);
    if (!form) return res.status(404).json({ message: "Form not found" });

    return res.status(200).json({ message: "Form deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};