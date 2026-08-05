const taskModel = require('../models/task');
const createHttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { incrementTasksCreated } = require('../observability/metrics');

const createTask = asyncHandler(async (req, res) => {
	const task = await taskModel.createTask(req.validatedTask);
	incrementTasksCreated();
	return res.status(201).json(task);
});

const getAllTasks = asyncHandler(async (req, res) => {
	const tasks = await taskModel.getAllTasks();
	return res.json(tasks);
});

const getTaskById = asyncHandler(async (req, res, next) => {
	const task = await taskModel.getTaskById(req.params.id);
	if (!task) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.json(task);
});

const updateTask = asyncHandler(async (req, res, next) => {
	const updatedTask = await taskModel.updateTask(req.params.id, req.taskPatch);
	if (!updatedTask) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.json(updatedTask);
});

const deleteTask = asyncHandler(async (req, res, next) => {
	const deleted = await taskModel.deleteTask(req.params.id);
	if (!deleted) {
		return next(createHttpError(404, 'task not found'));
	}

	return res.status(204).send();
});

module.exports = {
	createTask,
	getAllTasks,
	getTaskById,
	updateTask,
	deleteTask,
};
