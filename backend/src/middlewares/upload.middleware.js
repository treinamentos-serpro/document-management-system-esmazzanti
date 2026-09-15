const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { InvalidRequestError } = require('../errors');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storageDir);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').slice(0, 16);
    const uniqueName = `${crypto.randomUUID()}${safeExt}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (config.allowedMimeTypes && file.mimetype) {
    if (!config.allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      return cb(new InvalidRequestError('Tipo de arquivo não permitido.'));
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter,
});

module.exports = upload;
