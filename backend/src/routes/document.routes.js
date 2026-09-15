const express = require('express');
const upload = require('../middlewares/upload.middleware');
const documentController = require('../controllers/document.controller');

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
