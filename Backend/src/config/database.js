const mongoose = require("mongoose");
const logger = require("../utils/logger");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI;

async function connectToDatabase() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error", { error: error.message });
    throw error;
  }
}

module.exports = {
  mongoose,
  connectToDatabase,
};
