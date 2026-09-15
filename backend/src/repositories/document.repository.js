const fs = require('fs');
const path = require('path');
const config = require('../config');

class DocumentRepository {
  constructor(storageDir = config.storageDir) {
    this.storageDir = storageDir;
    this.documents = new Map();
    this.ensureStorageDirectory();
  }

  ensureStorageDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  save(document) {
    this.documents.set(document.id, { ...document });
    return this.documents.get(document.id);
  }

  findById(id) {
    const doc = this.documents.get(id);
    return doc ? { ...doc } : null;
  }

  findByOwner(owner) {
    const userDocs = [];
    for (const doc of this.documents.values()) {
      if (doc.owner === owner) {
        userDocs.push({ ...doc });
      }
    }
    // Sort descending by uploadedAt (most recent first)
    return userDocs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  delete(id) {
    return this.documents.delete(id);
  }

  getFilePath(storedName) {
    const safeName = path.basename(storedName);
    return path.join(this.storageDir, safeName);
  }

  fileExists(storedName) {
    const filePath = this.getFilePath(storedName);
    return fs.existsSync(filePath);
  }

  async deleteFile(storedName) {
    const filePath = this.getFilePath(storedName);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch {
      // Ignora erro ao remover arquivo inexistente ou já removido
    }
  }

  clear() {
    this.documents.clear();
  }
}

module.exports = new DocumentRepository();
module.exports.DocumentRepository = DocumentRepository;
