// rolesMiddleware.js
exports.allowRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    const userRoles = req.user.roles;
    const isAllowed = userRoles.some(role => allowedRoles.includes(role));
    if (!isAllowed) {
      return res.status(403).json({ message: "Access denied for this role." });
    }

    // ✅ Double-check organizer status if role is "organizer"
    if (allowedRoles.includes("organizer")) {
      const Organizer = require("../models/Organizer");
      const organizer = await Organizer.findOne({ userId: req.user._id });
      if (!organizer || organizer.status !== "active") {
        return res.status(403).json({ message: "Organizer is not active." });
      }
    }

    next();
  };
};
