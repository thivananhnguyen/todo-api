const { randomUUID } = require('crypto');

// In-memory store
const tasks = [];

function createTask({ description, status }) {
	const now = new Date().toISOString();
	const task = {
		id: randomUUID(),
		description,
		status,
		createdAt: now,
		updatedAt: now,
	};

	tasks.push(task);
	return task;
}

function getAllTasks() {
	return tasks;
}

function getTaskById(id) {
	return tasks.find((task) => task.id === id) || null;
}

function updateTask(id, payload) {
	const task = getTaskById(id);
	if (!task) {
		return null;
	}

	// Partial update: only apply known string fields when provided.
	if (typeof payload.description === 'string') {
		task.description = payload.description;
	}

	if (typeof payload.status === 'string') {
		task.status = payload.status;
	}

	task.updatedAt = new Date().toISOString();
	return task;
}

function deleteTask(id) {
	const index = tasks.findIndex((task) => task.id === id);
	if (index === -1) {
		return false;
	}

	tasks.splice(index, 1);
	return true;
}

module.exports = {
	createTask,
	getAllTasks,
	getTaskById,
	updateTask,
	deleteTask,
};
