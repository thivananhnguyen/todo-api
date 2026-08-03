const app = require('./app');

const PORT = process.env.PORT || 3000;

// Separate app creation from network startup for easier testing.
app.listen(PORT, () => {
	console.log(`Todo API listening on port ${PORT}`);
});
