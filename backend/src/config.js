const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(__dirname, '../storage'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10 MiB
  maxUserIdLength: parseInt(process.env.MAX_USER_ID_LENGTH, 10) || 100,
  allowedMimeTypes: process.env.ALLOWED_MIME_TYPES
    ? process.env.ALLOWED_MIME_TYPES.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    : null,
};

module.exports = config;
