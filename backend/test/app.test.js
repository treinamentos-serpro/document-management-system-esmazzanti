const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const documentRepository = require('../src/repositories/document.repository');

describe('Backend DMS - Testes de Integração', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  beforeEach(() => {
    documentRepository.clear();
  });

  test('o app backend é exportado como função Express', () => {
    assert.ok(app, 'o app deve estar definido');
    assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
  });

  test('GET /health retorna status 200 e { status: "ok" }', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body, { status: 'ok' });
  });

  describe('POST /upload', () => {
    test('retorna 400 se X-User-Id estiver ausente', async () => {
      const formData = new FormData();
      const blob = new Blob(['conteudo do arquivo'], { type: 'text/plain' });
      formData.append('file', blob, 'teste.txt');

      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'INVALID_REQUEST');
      assert.ok(data.error.message);
    });

    test('retorna 400 se nenhum arquivo for enviado', async () => {
      const formData = new FormData();
      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'X-User-Id': 'user-1',
        },
        body: formData,
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'INVALID_REQUEST');
    });

    test('retorna 400 se o arquivo for vazio', async () => {
      const formData = new FormData();
      const emptyBlob = new Blob([], { type: 'text/plain' });
      formData.append('file', emptyBlob, 'vazio.txt');

      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'X-User-Id': 'user-1',
        },
        body: formData,
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'INVALID_REQUEST');
    });

    test('realiza upload com sucesso e retorna 201 com metadados', async () => {
      const formData = new FormData();
      const blob = new Blob(['documento de teste'], { type: 'text/plain' });
      formData.append('file', blob, 'relatorio.txt');

      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'X-User-Id': 'user-1',
        },
        body: formData,
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.ok(data.id, 'deve possuir id');
      assert.strictEqual(data.originalName, 'relatorio.txt');
      assert.strictEqual(data.size, 'documento de teste'.length);
      assert.strictEqual(data.owner, 'user-1');
      assert.ok(data.uploadedAt);
      assert.strictEqual(data.storedName, undefined, 'não deve expor storedName');
    });
  });

  describe('GET /documents', () => {
    test('retorna 400 se X-User-Id estiver ausente', async () => {
      const res = await fetch(`${baseUrl}/documents`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'INVALID_REQUEST');
    });

    test('retorna lista vazia para usuário sem documentos', async () => {
      const res = await fetch(`${baseUrl}/documents`, {
        headers: { 'X-User-Id': 'user-sem-docs' },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.deepStrictEqual(data, { documents: [] });
    });

    test('retorna apenas os documentos pertencentes ao usuário solicitante', async () => {
      const form1 = new FormData();
      form1.append('file', new Blob(['arquivo 1']), 'doc1.txt');
      await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'X-User-Id': 'user-1' },
        body: form1,
      });

      const form2 = new FormData();
      form2.append('file', new Blob(['arquivo 2']), 'doc2.txt');
      await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'X-User-Id': 'user-2' },
        body: form2,
      });

      const res1 = await fetch(`${baseUrl}/documents`, {
        headers: { 'X-User-Id': 'user-1' },
      });
      const data1 = await res1.json();
      assert.strictEqual(data1.documents.length, 1);
      assert.strictEqual(data1.documents[0].originalName, 'doc1.txt');
      assert.strictEqual(data1.documents[0].owner, 'user-1');
      assert.strictEqual(data1.documents[0].storedName, undefined);

      const res2 = await fetch(`${baseUrl}/documents`, {
        headers: { 'X-User-Id': 'user-2' },
      });
      const data2 = await res2.json();
      assert.strictEqual(data2.documents.length, 1);
      assert.strictEqual(data2.documents[0].originalName, 'doc2.txt');
      assert.strictEqual(data2.documents[0].owner, 'user-2');
    });
  });

  describe('GET /documents/:id/download', () => {
    test('retorna 400 se X-User-Id estiver ausente', async () => {
      const res = await fetch(`${baseUrl}/documents/some-id/download`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'INVALID_REQUEST');
    });

    test('retorna 404 se o documento não existir', async () => {
      const res = await fetch(`${baseUrl}/documents/inexistente-123/download`, {
        headers: { 'X-User-Id': 'user-1' },
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'DOCUMENT_NOT_FOUND');
    });

    test('retorna 404 se o documento pertencer a outro usuário', async () => {
      const form = new FormData();
      form.append('file', new Blob(['secreto']), 'segredo.txt');
      const uploadRes = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'X-User-Id': 'user-1' },
        body: form,
      });
      const uploadedDoc = await uploadRes.json();

      const res = await fetch(`${baseUrl}/documents/${uploadedDoc.id}/download`, {
        headers: { 'X-User-Id': 'user-2' },
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error.code, 'DOCUMENT_NOT_FOUND');
    });

    test('realiza download do arquivo com headers corretos para o proprietário', async () => {
      const fileContent = 'conteudo para download';
      const form = new FormData();
      form.append('file', new Blob([fileContent], { type: 'text/plain' }), 'meu-arquivo.txt');

      const uploadRes = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'X-User-Id': 'user-owner' },
        body: form,
      });
      const uploadedDoc = await uploadRes.json();

      const res = await fetch(`${baseUrl}/documents/${uploadedDoc.id}/download`, {
        headers: { 'X-User-Id': 'user-owner' },
      });

      assert.strictEqual(res.status, 200);
      const disposition = res.headers.get('content-disposition');
      assert.ok(disposition && disposition.includes('meu-arquivo.txt'));
      const text = await res.text();
      assert.strictEqual(text, fileContent);
    });
  });
});

