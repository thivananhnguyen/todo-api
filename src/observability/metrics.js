const client = require('prom-client');

const register = new client.Registry();

const httpRequestsTotal = new client.Counter({
	name: 'http_requests_total',
	help: 'Nombre total de requetes HTTP servies',
	labelNames: ['method', 'route', 'status'],
	registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
	name: 'http_request_duration_seconds',
	help: 'Duree des requetes HTTP en secondes',
	labelNames: ['method', 'route', 'status'],
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
	registers: [register],
});

const tasksCreatedTotal = new client.Counter({
	name: 'tasks_created_total',
	help: 'Nombre total de taches creees depuis le demarrage',
	registers: [register],
});

function normalizeRouteLabel(req) {
	if (req.route && typeof req.route.path === 'string') {
		const baseUrl = req.baseUrl || '';
		const fullRoute = `${baseUrl}${req.route.path}`;
		if (fullRoute.length > 1 && fullRoute.endsWith('/')) {
			return fullRoute.slice(0, -1);
		}
		return fullRoute || '/';
	}

	if (req.path === '/metrics' || req.path === '/health') {
		return req.path;
	}

	return 'unmatched';
}

function metricsMiddleware(req, res, next) {
	const startTime = process.hrtime.bigint();

	res.on('finish', () => {
		const route = normalizeRouteLabel(req);
		const method = req.method;
		const status = String(res.statusCode);
		const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;

		httpRequestsTotal.inc({ method, route, status });
		httpRequestDurationSeconds.observe({ method, route, status }, durationSeconds);
	});

	next();
}

function incrementTasksCreated() {
	tasksCreatedTotal.inc();
}

async function metricsHandler(req, res) {
	res.set('Content-Type', register.contentType);
	res.send(await register.metrics());
}

function resetMetrics() {
	register.resetMetrics();
}

module.exports = {
	metricsMiddleware,
	metricsHandler,
	incrementTasksCreated,
	resetMetrics,
};