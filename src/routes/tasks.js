const express = require('express');
const taskModel = require('../models/task');

const router = express.Router();

function createHttpError(status, message) {
	const error = new Error(message);
	error.status = status;
	return error;
}

router.post('/', (req, res, next) => {
	const { description, status } = req.body;

	if (typeof description !== 'string' || typeof status !== 'string') {
		return next(createHttpError(400, 'description and status are required strings'));
	}

	const task = taskModel.createTask({ description, status });
	return res.status(201).json(task);
});

router.get('/', (req, res) => {
	res.json(taskModel.getAllTasks());
});

router.get('/:id', (req, res, next) => {
	const task = taskModel.getTaskById(req.params.id);
	if (!task) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.json(task);
});

router.put('/:id', (req, res, next) => {
	const updatedTask = taskModel.updateTask(req.params.id, req.body);
	if (!updatedTask) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.json(updatedTask);
});

router.delete('/:id', (req, res, next) => {
	const deleted = taskModel.deleteTask(req.params.id);
	if (!deleted) {
		return next(createHttpError(404, 'task not found'));
	}

	// 204 means deletion succeeded and no response body is returned.
	return res.status(204).send();
});

module.exports = router;
