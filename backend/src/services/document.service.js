const crypto = require('crypto');
const config = require('../config');
const defaultDocumentRepository = require('../repositories/document.repository');
const {
  InvalidRequestError,
  DocumentNotFoundError,
  FileTooLargeError,
  InternalError,
} = require('../errors');

class DocumentService {
  constructor(documentRepository = defaultDocumentRepository) {
    this.documentRepository = documentRepository;
  }

  validateOwner(owner) {
    if (
      !owner ||
      typeof owner !== 'string' ||
      owner.trim() === '' ||
      owner.length > config.maxUserIdLength
    ) {
      throw new InvalidRequestError('Identificador de usuário (X-User-Id) é obrigatório e deve ser válido.');
    }
    return owner;
  }

  validateFile(file) {
    if (!file) {
      throw new InvalidRequestError('Nenhum arquivo enviado.');
    }

    if (file.size === 0) {
      throw new InvalidRequestError('O arquivo enviado está vazio.');
    }

    if (config.allowedMimeTypes && file.mimetype) {
      const isAllowed = config.allowedMimeTypes.includes(file.mimetype.toLowerCase());
      if (!isAllowed) {
        throw new InvalidRequestError('Tipo de arquivo não permitido.');
      }
    }

    if (file.size > config.maxFileSize) {
      throw new FileTooLargeError('O arquivo excede o tamanho máximo permitido.');
    }
  }

  async removeUploadedFile(file) {
    if (file && file.filename) {
      await this.documentRepository.deleteFile(file.filename);
    }
  }

  createDocument(file, owner) {
    return {
      id: crypto.randomUUID(),
      originalName: file.originalname || 'documento',
      storedName: file.filename,
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      owner,
    };
  }

  async uploadDocument({ file, owner }) {
    try {
      this.validateOwner(owner);
      this.validateFile(file);
    } catch (err) {
      await this.removeUploadedFile(file);
      throw err;
    }

    const doc = this.createDocument(file, owner);

    try {
      this.documentRepository.save(doc);
    } catch (err) {
      await this.removeUploadedFile(file);
      throw new InternalError('Falha ao registrar o documento.');
    }

    return this.toPublicDocument(doc);
  }

  listDocuments(owner) {
    this.validateOwner(owner);
    const docs = this.documentRepository.findByOwner(owner);
    return docs.map((doc) => this.toPublicDocument(doc));
  }

  getDocumentForDownload({ id, owner }) {
    this.validateOwner(owner);

    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new InvalidRequestError('Identificador de documento inválido.');
    }

    const doc = this.documentRepository.findById(id);
    if (!doc || doc.owner !== owner) {
      throw new DocumentNotFoundError('Documento não encontrado.');
    }

    if (!this.documentRepository.fileExists(doc.storedName)) {
      throw new DocumentNotFoundError('Documento não encontrado.');
    }

    return {
      filePath: this.documentRepository.getFilePath(doc.storedName),
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
    };
  }

  toPublicDocument(doc) {
    return {
      id: doc.id,
      originalName: doc.originalName,
      size: doc.size,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      owner: doc.owner,
    };
  }
}

module.exports = new DocumentService();
module.exports.DocumentService = DocumentService;
