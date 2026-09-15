const multer = require('multer');
const { AppError } = require('../errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o tamanho máximo permitido.',
        },
      });
    }
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: err.message || 'Erro no processamento do arquivo.',
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Tratamento para JSON malformado ou erros de parsing do Express
  if (err.status === 400 || err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Formato de requisição inválido.',
      },
    });
  }

  // Erro interno não esperado (não expor detalhes internos ou stack trace)
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro interno no servidor.',
    },
  });
}

module.exports = errorHandler;
