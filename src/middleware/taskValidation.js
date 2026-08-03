const createHttpError = require('../utils/httpError');

const ALLOWED_STATUS = new Set(['todo', 'in-progress', 'done']);
const MAX_DESCRIPTION_LENGTH = 1000;

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateDescription(description, { required }) {
	if (description === undefined || description === null) {
		if (required) {
			return 'description is required';
		}
		return null;
	}

	if (typeof description !== 'string') {
		return 'description must be a string';
	}

	const trimmed = description.trim();
	if (trimmed.length === 0) {
		return 'description must not be empty';
	}

	if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
		return `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
	}

	return null;
}

function validateStatus(status, { required }) {
	if (status === undefined || status === null) {
		if (required) {
			return 'status is required';
		}
		return null;
	}

	if (typeof status !== 'string') {
		return 'status must be a string';
	}

	if (!ALLOWED_STATUS.has(status)) {
		return `status must be one of: ${Array.from(ALLOWED_STATUS).join(', ')}`;
	}

	return null;
}

function validateCreateTask(req, res, next) {
	if (!isPlainObject(req.body)) {
		return next(createHttpError(400, 'request body must be a JSON object'));
	}

	const { description, status } = req.body;

	const descriptionError = validateDescription(description, { required: true });
	if (descriptionError) {
		return next(createHttpError(400, descriptionError));
	}

	const statusError = validateStatus(status, { required: true });
	if (statusError) {
		return next(createHttpError(400, statusError));
	}

	req.validatedTask = {
		description: description.trim(),
		status,
	};

	return next();
}

function validateUpdateTask(req, res, next) {
	if (!isPlainObject(req.body)) {
		return next(createHttpError(400, 'request body must be a JSON object'));
	}

	const hasDescription = Object.prototype.hasOwnProperty.call(req.body, 'description');
	const hasStatus = Object.prototype.hasOwnProperty.call(req.body, 'status');

	if (!hasDescription && !hasStatus) {
		return next(createHttpError(400, 'provide at least one field: description or status'));
	}

	const descriptionError = validateDescription(req.body.description, { required: false });
	if (descriptionError) {
		return next(createHttpError(400, descriptionError));
	}

	const statusError = validateStatus(req.body.status, { required: false });
	if (statusError) {
		return next(createHttpError(400, statusError));
	}

	const patch = {};
	if (hasDescription) {
		patch.description = req.body.description.trim();
	}
	if (hasStatus) {
		patch.status = req.body.status;
	}

	req.taskPatch = patch;
	return next();
}

module.exports = {
	validateCreateTask,
	validateUpdateTask,
};
