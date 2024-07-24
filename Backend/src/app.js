const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");
const websiteRoutes = require("./routes/WebsiteRoutes");
const TextContentManagerGCP = require("./routes/TextContentManagerGCP");
const MediaContentManagerGCP = require("./routes/MediaContentManagerGCP");
const cors = require("cors");
const dbConfig = require("./config/database"); // Import the database configuration

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRoutes);
app.use("/user", userManagementRoutes);
app.use("/website", websiteRoutes); 
app.use("/web_gcp", TextContentManagerGCP); 
app.use("/web_media_gcp", MediaContentManagerGCP); 

app.get("/", (req, res) => {
  res.send("<h1>Home Page</h1>");
});

// Start the server after ensuring database connection
dbConfig
  .connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database. Server not started.");
    process.exit(1); // Exit the process with a failure code
  });

dbConfig.mongoose.connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);
