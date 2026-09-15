const API_PREFIX = '/api';

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function throwApiError(response) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  throw new ApiError(
    payload?.error?.message || 'Não foi possível concluir a operação.',
    payload?.error?.code || 'UNEXPECTED_ERROR',
    response.status,
  );
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor.',
      'NETWORK_ERROR',
      0,
    );
  }

  if (!response.ok) {
    await throwApiError(response);
  }

  return response;
}

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData,
  });

  return response.json();
}

export async function listDocuments(userId) {
  const response = await request('/documents', {
    headers: userHeaders(userId),
  });
  const payload = await response.json();

  return payload.documents;
}

export async function downloadDocument(documentId, userId) {
  const response = await request(
    `/documents/${encodeURIComponent(documentId)}/download`,
    { headers: userHeaders(userId) },
  );

  return response.blob();
}