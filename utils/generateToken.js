const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  // Include user ID and roles in the JWT payload
  return jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

module.exports = generateToken;
