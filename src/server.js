require('dotenv').config();

const { getEnv } = require('./config/env');

async function startServer() {
	try {
		const env = getEnv();
		const app = require('./app');
		const taskModel = require('./models/task');

		// Ensure DB schema exists before serving requests.
		await taskModel.initializeTaskTable();

		app.listen(env.port, () => {
			console.log(`Todo API listening on port ${env.port}`);
		});
	} catch (error) {
		console.error('Failed to initialize database:', error.message);
		process.exit(1);
	}
}

startServer();
