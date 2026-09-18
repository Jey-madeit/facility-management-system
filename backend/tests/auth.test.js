process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/facility-management';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-value-32-chars-long';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');

test('API health returns status ok', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('Empty login payload is rejected', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({});

  assert.equal(response.status, 400);
});

test('Unknown routes return 404', async () => {
  const response = await request(app).get('/api/not-real');
  assert.equal(response.status, 404);
});
