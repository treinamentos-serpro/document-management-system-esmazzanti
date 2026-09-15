class AppError extends Error {
  constructor(message, statusCode = 400, code = 'INVALID_REQUEST') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

class InvalidRequestError extends AppError {
  constructor(message = 'Requisição inválida.') {
    super(message, 400, 'INVALID_REQUEST');
  }
}

class DocumentNotFoundError extends AppError {
  constructor(message = 'Documento não encontrado.') {
    super(message, 404, 'DOCUMENT_NOT_FOUND');
  }
}

class FileTooLargeError extends AppError {
  constructor(message = 'O arquivo excede o tamanho máximo permitido.') {
    super(message, 413, 'FILE_TOO_LARGE');
  }
}

class InternalError extends AppError {
  constructor(message = 'Ocorreu um erro interno no servidor.') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = {
  AppError,
  InvalidRequestError,
  DocumentNotFoundError,
  FileTooLargeError,
  InternalError,
};
