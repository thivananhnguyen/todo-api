const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const taskRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');
const {
	metricsMiddleware,
	metricsHandler,
} = require('./observability/metrics');

const app = express();

app.use(helmet());
app.use(cors());
app.use(metricsMiddleware);
// Parse JSON request bodies for API routes.
app.use(express.json({ limit: '16kb' }));

app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/metrics', metricsHandler);

app.use('/api/tasks', taskRoutes);

// Keep one centralized JSON error response format.
app.use(errorHandler);

module.exports = app;
