const { randomUUID } = require('crypto');
const pool = require('../db/pool');

function mapTaskRow(row) {
	return {
		id: row.id,
		description: row.description,
		status: row.status,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}

async function initializeTaskTable() {
	// Create schema at startup to keep Etape 4 self-contained.
	await pool.query(`
		CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			description TEXT NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'done')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);
}

async function createTask({ description, status }) {
	const id = randomUUID();
	const result = await pool.query(
		`INSERT INTO tasks (id, description, status)
		 VALUES ($1, $2, $3)
		 RETURNING id, description, status, created_at, updated_at`,
		[id, description, status]
	);

	return mapTaskRow(result.rows[0]);
}

async function getAllTasks() {
	const result = await pool.query(
		`SELECT id, description, status, created_at, updated_at
		 FROM tasks
		 ORDER BY created_at DESC`
	);

	return result.rows.map(mapTaskRow);
}

async function getTaskById(id) {
	const result = await pool.query(
		`SELECT id, description, status, created_at, updated_at
		 FROM tasks
		 WHERE id = $1`,
		[id]
	);

	if (result.rowCount === 0) {
		return null;
	}

	return mapTaskRow(result.rows[0]);
}

async function updateTask(id, payload) {
	const updates = [];
	const values = [];

	if (typeof payload.description === 'string') {
		values.push(payload.description);
		updates.push(`description = $${values.length}`);
	}

	if (typeof payload.status === 'string') {
		values.push(payload.status);
		updates.push(`status = $${values.length}`);
	}

	if (updates.length === 0) {
		return getTaskById(id);
	}

	values.push(id);

	const result = await pool.query(
		`UPDATE tasks
		 SET ${updates.join(', ')}, updated_at = NOW()
		 WHERE id = $${values.length}
		 RETURNING id, description, status, created_at, updated_at`,
		values
	);

	if (result.rowCount === 0) {
		return null;
	}

	return mapTaskRow(result.rows[0]);
}

async function deleteTask(id) {
	const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
	return result.rowCount > 0;
}

module.exports = {
	initializeTaskTable,
	createTask,
	getAllTasks,
	getTaskById,
	updateTask,
	deleteTask,
};
