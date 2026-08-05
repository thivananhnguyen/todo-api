process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'todo_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'todo_pass';
process.env.DB_NAME = process.env.DB_NAME || 'todo_test';

const request = require('supertest');
const { resetMetrics } = require('../../src/observability/metrics');

jest.mock('../../src/models/task', () => ({
  createTask: jest.fn(),
  getAllTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

const taskModel = require('../../src/models/task');
const app = require('../../src/app');

describe('Todo API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMetrics();
  });

  test('GET /health returns service status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });

  test('POST /api/tasks creates a task with trimmed description', async () => {
    const createdTask = {
      id: 'task-1',
      description: 'Learn CI',
      status: 'todo',
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-05T10:00:00.000Z',
    };

    taskModel.createTask.mockResolvedValue(createdTask);

    const response = await request(app)
      .post('/api/tasks')
      .send({ description: '  Learn CI  ', status: 'todo' });

    expect(response.status).toBe(201);
    expect(taskModel.createTask).toHaveBeenCalledWith({
      description: 'Learn CI',
      status: 'todo',
    });
    expect(response.body).toEqual(createdTask);
  });

  test('POST /api/tasks returns 400 for invalid status', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ description: 'Task', status: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('status must be one of: todo, in-progress, done');
  });

  test('GET /api/tasks returns all tasks', async () => {
    const tasks = [
      {
        id: 'task-1',
        description: 'A',
        status: 'todo',
        createdAt: '2026-08-05T10:00:00.000Z',
        updatedAt: '2026-08-05T10:00:00.000Z',
      },
    ];

    taskModel.getAllTasks.mockResolvedValue(tasks);

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(tasks);
  });

  test('GET /api/tasks/:id returns 404 when task is missing', async () => {
    taskModel.getTaskById.mockResolvedValue(null);

    const response = await request(app).get('/api/tasks/not-found');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('task not found');
  });

  test('PUT /api/tasks/:id updates task when payload is valid', async () => {
    const updatedTask = {
      id: 'task-1',
      description: 'Updated',
      status: 'done',
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-05T10:05:00.000Z',
    };

    taskModel.updateTask.mockResolvedValue(updatedTask);

    const response = await request(app)
      .put('/api/tasks/task-1')
      .send({ description: '  Updated  ', status: 'done' });

    expect(response.status).toBe(200);
    expect(taskModel.updateTask).toHaveBeenCalledWith('task-1', {
      description: 'Updated',
      status: 'done',
    });
    expect(response.body).toEqual(updatedTask);
  });

  test('PUT /api/tasks/:id returns 400 when body has no updatable fields', async () => {
    const response = await request(app).put('/api/tasks/task-1').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('provide at least one field: description or status');
  });

  test('DELETE /api/tasks/:id returns 204 when task exists', async () => {
    taskModel.deleteTask.mockResolvedValue(true);

    const response = await request(app).delete('/api/tasks/task-1');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  test('DELETE /api/tasks/:id returns 404 when task does not exist', async () => {
    taskModel.deleteTask.mockResolvedValue(false);

    const response = await request(app).delete('/api/tasks/task-1');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('task not found');
  });

  test('returns 400 for malformed JSON payload', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{"description":"broken"');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Malformed JSON payload');
  });

  test('returns 400 when JSON payload is too large', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        description: 'a'.repeat(17000),
        status: 'todo',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('JSON payload is too large');
  });

  test('GET /metrics returns plain text prometheus metrics', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('# HELP http_requests_total');
    expect(response.text).toContain('# TYPE http_requests_total counter');
  });

  test('increments http_requests_total by three for repeated route calls', async () => {
    taskModel.getAllTasks.mockResolvedValue([]);

    await request(app).get('/api/tasks');
    await request(app).get('/api/tasks');
    await request(app).get('/api/tasks');

    const metricsResponse = await request(app).get('/metrics');
    expect(metricsResponse.status).toBe(200);

    const line = metricsResponse.text
      .split('\n')
      .find((entry) => entry.startsWith('http_requests_total{method="GET",route="/api/tasks",status="200"}'));

    expect(line).toBeDefined();
    expect(Number(line.split(' ').pop())).toBe(3);
  });

  test('counts unmatched routes that return 404', async () => {
    await request(app).get('/this-route-does-not-exist');

    const metricsResponse = await request(app).get('/metrics');
    const line = metricsResponse.text
      .split('\n')
      .find((entry) => entry.startsWith('http_requests_total{method="GET",route="unmatched",status="404"}'));

    expect(line).toBeDefined();
    expect(Number(line.split(' ').pop())).toBe(1);
  });

  test('increments tasks_created_total when creating a task', async () => {
    taskModel.createTask.mockResolvedValue({
      id: 'task-1',
      description: 'Learn metrics',
      status: 'todo',
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-05T10:00:00.000Z',
    });

    const createResponse = await request(app)
      .post('/api/tasks')
      .send({ description: 'Learn metrics', status: 'todo' });

    expect(createResponse.status).toBe(201);

    const metricsResponse = await request(app).get('/metrics');
    const line = metricsResponse.text
      .split('\n')
      .find((entry) => entry.startsWith('tasks_created_total '));

    expect(line).toBeDefined();
    expect(Number(line.split(' ').pop())).toBe(1);
  });
});
