const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const dbConfig = require("./config/database");
const { errorHandler } = require("./middleware/errorHandler");
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");
const websiteRoutes = require("./routes/WebsiteRoutes");
const TextContentManagerGCP = require("./routes/TextContentManagerGCP");
const MediaContentManagerGCP = require("./routes/MediaContentManagerGCP");
const ThemeManagerGCP = require("./routes/ThemeManagerGCP");
const portalManagementRoutes = require("./routes/portalManagementRoutes");
const contentDeliveryRoutes = require("./routes/contentDeliveryRoutes");

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET environment variable is not set");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Global middleware
app.use(express.json({ limit: "10mb" }));
app.use(generalLimiter);

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, data: { message: "iGOT Karmayogi CMS API", version: "1.0.0" } });
});

// Auth routes (with stricter rate limiting)
app.use("/auth", authLimiter, authRoutes);

// Admin routes
app.use("/user", userManagementRoutes);
app.use("/website", websiteRoutes);
app.use("/web_gcp", TextContentManagerGCP);
app.use("/web_media_gcp", MediaContentManagerGCP);
app.use("/theme_manager_Store_gcp", ThemeManagerGCP);
app.use("/portals", portalManagementRoutes);

// Public content delivery API (for iGOT portals to consume)
app.use("/api/v1", contentDeliveryRoutes);

// Centralized error handler (must be after all routes)
app.use(errorHandler);

// Start the server after ensuring database connection
dbConfig
  .connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error("Failed to connect to the database. Server not started.");
    process.exit(1);
  });

dbConfig.mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", { error: err.message });
});
