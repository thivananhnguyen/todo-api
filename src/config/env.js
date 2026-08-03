function requireEnv(name) {
	const value = process.env[name];
	if (!value || value.trim() === '') {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function parsePort(name, rawValue) {
	const port = Number(rawValue);
	if (!Number.isInteger(port) || port <= 0) {
		throw new Error(`${name} must be a positive integer`);
	}
	return port;
}

function getEnv() {
	const port = parsePort('PORT', process.env.PORT || '3000');
	const dbPort = parsePort('DB_PORT', requireEnv('DB_PORT'));

	return {
		nodeEnv: process.env.NODE_ENV || 'development',
		port,
		dbHost: requireEnv('DB_HOST'),
		dbPort,
		dbUser: requireEnv('DB_USER'),
		dbPassword: requireEnv('DB_PASSWORD'),
		dbName: requireEnv('DB_NAME'),
	};
}

module.exports = {
	getEnv,
};
