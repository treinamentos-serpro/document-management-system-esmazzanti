const defaultDocumentService = require('../services/document.service');

class DocumentController {
  constructor(documentService = defaultDocumentService) {
    this.documentService = documentService;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  async upload(req, res, next) {
    try {
      const owner = req.header('x-user-id');
      const file = req.file;
      const document = await this.documentService.uploadDocument({ file, owner });
      return res.status(201).json(document);
    } catch (err) {
      return next(err);
    }
  }

  list(req, res, next) {
    try {
      const owner = req.header('x-user-id');
      const documents = this.documentService.listDocuments(owner);
      return res.status(200).json({ documents });
    } catch (err) {
      return next(err);
    }
  }

  download(req, res, next) {
    try {
      const owner = req.header('x-user-id');
      const { id } = req.params;
      const fileInfo = this.documentService.getDocumentForDownload({ id, owner });

      res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
      if (fileInfo.size !== undefined) {
        res.setHeader('Content-Length', fileInfo.size);
      }

      return res.download(fileInfo.filePath, fileInfo.originalName, (err) => {
        if (err && !res.headersSent) {
          return next(err);
        }
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new DocumentController();
module.exports.DocumentController = DocumentController;
