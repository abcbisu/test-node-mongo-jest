// tests/app.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Express API Tests', () => {
  afterEach(async () => {
    await User.deleteMany(); // Clean up after each test
  });

  test('POST /users - should create a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Aparna Ghose', email: 'aparna@example.com', age: 30 });
    
    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Aparna Ghose');
    expect(response.body._id).toBeDefined();
  });

  test('GET /users - should retrieve all users', async () => {
    await User.create({ name: 'John Doe', email: 'john@example.com', age: 25 });
    const response = await request(app).get('/users');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('John Doe');
  });

  test('PUT /users/:id - should update a user', async () => {
    const user = await User.create({ name: 'Jane Doe', email: 'jane@example.com', age: 28 });
    const response = await request(app)
      .put(`/users/${user._id}`)
      .send({ age: 29 });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.age).toBe(29);
  });

  test('DELETE /users/:id - should delete a user', async () => {
    const user = await User.create({ name: 'Jake Doe', email: 'jake@example.com' });
    const response = await request(app).delete(`/users/${user._id}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User deleted successfully');
  });

  test('GET /users/:id - should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/users/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});
