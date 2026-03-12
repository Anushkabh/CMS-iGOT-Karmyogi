const multer = require("multer");

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/json",
  "text/css",
  "text/javascript",
  "application/javascript",
  "text/html",
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "10", 10) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(`File type ${file.mimetype} is not allowed`);
      err.statusCode = 400;
      err.isOperational = true;
      cb(err, false);
    }
  },
});

module.exports = upload;
