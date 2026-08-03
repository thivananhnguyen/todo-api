const taskModel = require('../models/task');
const createHttpError = require('../utils/httpError');

function createTask(req, res) {
	const task = taskModel.createTask(req.validatedTask);
	return res.status(201).json(task);
}

function getAllTasks(req, res) {
	return res.json(taskModel.getAllTasks());
}

function getTaskById(req, res, next) {
	const task = taskModel.getTaskById(req.params.id);
	if (!task) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.json(task);
}

function updateTask(req, res, next) {
	const updatedTask = taskModel.updateTask(req.params.id, req.taskPatch);
	if (!updatedTask) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.json(updatedTask);
}

function deleteTask(req, res, next) {
	const deleted = taskModel.deleteTask(req.params.id);
	if (!deleted) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.status(204).send();
}

module.exports = {
	createTask,
	getAllTasks,
	getTaskById,
	updateTask,
	deleteTask,
};
