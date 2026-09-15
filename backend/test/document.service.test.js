const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { DocumentService } = require('../src/services/document.service');
const { DocumentRepository } = require('../src/repositories/document.repository');
const { InvalidRequestError, DocumentNotFoundError, FileTooLargeError } = require('../src/errors');
const path = require('path');
const os = require('os');
const fs = require('fs');

describe('DocumentService Unit Tests', () => {
  let tempDir;
  let repository;
  let service;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
    repository = new DocumentRepository(tempDir);
    service = new DocumentService(repository);
  });

  test('validateOwner lança InvalidRequestError se owner for inválido', () => {
    assert.throws(() => service.validateOwner(null), InvalidRequestError);
    assert.throws(() => service.validateOwner(''), InvalidRequestError);
    assert.throws(() => service.validateOwner('   '), InvalidRequestError);
    assert.throws(() => service.validateOwner('a'.repeat(101)), InvalidRequestError);
    assert.strictEqual(service.validateOwner('user-123'), 'user-123');
  });

  test('uploadDocument lança erro se arquivo não for fornecido', async () => {
    await assert.rejects(
      async () => service.uploadDocument({ file: null, owner: 'user-1' }),
      InvalidRequestError
    );
  });

  test('uploadDocument remove arquivo e lança erro se tamanho for 0', async () => {
    const dummyFile = path.join(tempDir, 'empty.txt');
    fs.writeFileSync(dummyFile, '');

    await assert.rejects(
      async () =>
        service.uploadDocument({
          file: {
            originalname: 'empty.txt',
            filename: 'empty.txt',
            size: 0,
            mimetype: 'text/plain',
          },
          owner: 'user-1',
        }),
      InvalidRequestError
    );

    assert.strictEqual(fs.existsSync(dummyFile), false);
  });

  test('listDocuments ordena documentos do mais recente para o mais antigo', () => {
    repository.save({
      id: 'doc-1',
      originalName: 'primeiro.txt',
      storedName: 'f1.txt',
      size: 10,
      mimeType: 'text/plain',
      uploadedAt: '2026-09-15T10:00:00.000Z',
      owner: 'user-1',
    });

    repository.save({
      id: 'doc-2',
      originalName: 'segundo.txt',
      storedName: 'f2.txt',
      size: 10,
      mimeType: 'text/plain',
      uploadedAt: '2026-09-15T12:00:00.000Z',
      owner: 'user-1',
    });

    const docs = service.listDocuments('user-1');
    assert.strictEqual(docs.length, 2);
    assert.strictEqual(docs[0].id, 'doc-2');
    assert.strictEqual(docs[1].id, 'doc-1');
  });

  test('getDocumentForDownload lança DocumentNotFoundError se arquivo físico não existir', () => {
    repository.save({
      id: 'doc-sem-arquivo',
      originalName: 'perdido.txt',
      storedName: 'nao-existe.txt',
      size: 10,
      mimeType: 'text/plain',
      uploadedAt: '2026-09-15T10:00:00.000Z',
      owner: 'user-1',
    });

    assert.throws(
      () => service.getDocumentForDownload({ id: 'doc-sem-arquivo', owner: 'user-1' }),
      DocumentNotFoundError
    );
  });
});
