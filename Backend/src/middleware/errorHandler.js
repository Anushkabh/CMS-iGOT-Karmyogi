const multer = require("multer");
const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    err.statusCode = 400;
    err.isOperational = true;
    if (err.code === "LIMIT_FILE_SIZE") {
      err.message = "File size exceeds the allowed limit";
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode}: ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
