function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || (err.name === 'SequelizeValidationError' ? 400 : 500);
  res.status(status).json({
    message: err.message || 'Internal server error',
    errors: err.errors?.map((item) => item.message),
  });
}

module.exports = { notFound, errorHandler };
