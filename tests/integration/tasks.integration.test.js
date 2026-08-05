process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'todo_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'todo_pass';
process.env.DB_NAME = process.env.DB_NAME || 'todo_test';

const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const taskModel = require('../../src/models/task');

describe('Todo API integration with PostgreSQL', () => {
  beforeAll(async () => {
    await taskModel.initializeTaskTable();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE tasks');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('creates a task and reads it back by id', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({ description: 'integration task', status: 'todo' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.description).toBe('integration task');
    expect(createResponse.body.status).toBe('todo');
    expect(createResponse.body.id).toBeDefined();

    const getResponse = await request(app).get(`/api/tasks/${createResponse.body.id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toMatchObject({
      id: createResponse.body.id,
      description: 'integration task',
      status: 'todo',
    });
  });

  test('returns 404 for a non-existing task id', async () => {
    const response = await request(app).get('/api/tasks/not-found-id');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('task not found');
  });

  test('returns 400 for invalid request bodies', async () => {
    const missingFieldResponse = await request(app)
      .post('/api/tasks')
      .send({ status: 'todo' });

    expect(missingFieldResponse.status).toBe(400);
    expect(missingFieldResponse.body.error).toBe('description is required');

    const oversizedResponse = await request(app)
      .post('/api/tasks')
      .send({ description: 'a'.repeat(1001), status: 'todo' });

    expect(oversizedResponse.status).toBe(400);
    expect(oversizedResponse.body.error).toBe('description must be at most 1000 characters');
  });

  test('deletes a task and confirms it is removed from list', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({ description: 'delete me', status: 'todo' });

    expect(createResponse.status).toBe(201);

    const deleteResponse = await request(app).delete(`/api/tasks/${createResponse.body.id}`);
    expect(deleteResponse.status).toBe(204);

    const listResponse = await request(app).get('/api/tasks');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual([]);
  });
});
