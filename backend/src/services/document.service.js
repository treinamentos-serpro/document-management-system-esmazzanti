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

  async uploadDocument({ file, owner }) {
    try {
      this.validateOwner(owner);
    } catch (err) {
      if (file && file.filename) {
        await this.documentRepository.deleteFile(file.filename);
      }
      throw err;
    }

    if (!file) {
      throw new InvalidRequestError('Nenhum arquivo enviado.');
    }

    if (file.size === 0) {
      if (file.filename) {
        await this.documentRepository.deleteFile(file.filename);
      }
      throw new InvalidRequestError('O arquivo enviado está vazio.');
    }

    if (config.allowedMimeTypes && file.mimetype) {
      const isAllowed = config.allowedMimeTypes.includes(file.mimetype.toLowerCase());
      if (!isAllowed) {
        if (file.filename) {
          await this.documentRepository.deleteFile(file.filename);
        }
        throw new InvalidRequestError('Tipo de arquivo não permitido.');
      }
    }

    if (file.size > config.maxFileSize) {
      if (file.filename) {
        await this.documentRepository.deleteFile(file.filename);
      }
      throw new FileTooLargeError('O arquivo excede o tamanho máximo permitido.');
    }

    const doc = {
      id: crypto.randomUUID(),
      originalName: file.originalname || 'documento',
      storedName: file.filename,
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      owner,
    };

    try {
      this.documentRepository.save(doc);
    } catch (err) {
      if (file.filename) {
        await this.documentRepository.deleteFile(file.filename);
      }
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
