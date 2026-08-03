const { Pool } = require('pg');

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 5432),
	user: process.env.DB_USER || 'todo_user',
	password: process.env.DB_PASSWORD || 'todo_pass',
	database: process.env.DB_NAME || 'todo_db',
});

// Keep process alive and report unexpected idle-client errors.
pool.on('error', (error) => {
	console.error('Unexpected PostgreSQL client error:', error.message);
});

module.exports = pool;
