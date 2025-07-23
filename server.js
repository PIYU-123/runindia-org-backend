const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger.json");

dotenv.config();
connectDB();  // Connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads folder (for KYC documents and profile images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Swagger API docs route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount authentication routes under /api/auth
app.use("/api/auth", require("./routes/auth"));

app.use("/api/events", require("./routes/eventRoutes"));

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
