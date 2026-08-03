function errorHandler(err, req, res, next) {
	// Map internal/app errors to a stable client-facing JSON response.
	const status = err.status || 500;
	const message = err.message || 'Internal Server Error';

	res.status(status).json({
		error: message,
	});
}

module.exports = errorHandler;
