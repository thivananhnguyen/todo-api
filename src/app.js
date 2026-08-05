const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const taskRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
// Parse JSON request bodies for API routes.
app.use(express.json({ limit: '16kb' }));

app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Phase 5 drill: force a visible regression in production only when explicitly enabled.
app.use((req, res, next) => {
	if (process.env.PHASE5_FORCE_TASKS_500 === '1' && req.method === 'GET' && req.path === '/api/tasks') {
		return res.status(500).json({ error: 'phase5 regression drill' });
	}
	next();
});

app.use('/api/tasks', taskRoutes);

// Keep one centralized JSON error response format.
app.use(errorHandler);

module.exports = app;
