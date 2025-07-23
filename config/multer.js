const multer = require("multer");
const fs = require("fs");
const path = require("path");
const kycDir = path.join(__dirname, "../uploads/kyc");
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, kycDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
module.exports = multer({ storage });
