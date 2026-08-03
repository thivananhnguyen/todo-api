const app = require('./app');
const taskModel = require('./models/task');

const PORT = process.env.PORT || 3000;

async function startServer() {
	try {
		// Ensure DB schema exists before serving requests.
		await taskModel.initializeTaskTable();

		app.listen(PORT, () => {
			console.log(`Todo API listening on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to initialize database:', error.message);
		process.exit(1);
	}
}

startServer();
