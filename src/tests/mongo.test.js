const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

describe('MongoDB Integration Tests', () => {
  afterEach(async () => {
    await User.deleteMany(); // Cleanup after each test
  });

  test('Should create a user', async () => {
    const user = new User({
      name: 'Aparna Ghose',
      email: 'aparna@example.com',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Metropolis',
        coordinates: [77.1234, 28.7041],
      },
    });
    const savedUser = await user.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe('aparna@example.com');
  });

  test('Should read users', async () => {
    await User.create({ name: 'John Doe', email: 'john@example.com', age: 25 });
    const users = await User.find();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe('John Doe');
  });

  test('Should update a user', async () => {
    const user = await User.create({ name: 'Jane Doe', email: 'jane@example.com', age: 28 });
    const updatedUser = await User.findByIdAndUpdate(user._id, { age: 29 }, { new: true });
    expect(updatedUser.age).toBe(29);
  });

  test('Should delete a user', async () => {
    const user = await User.create({ name: 'Jake Doe', email: 'jake@example.com' });
    await User.findByIdAndDelete(user._id);
    const foundUser = await User.findById(user._id);
    expect(foundUser).toBeNull();
  });

  test('Should perform aggregation - Average age', async () => {
    await User.insertMany([
      { name: 'Alice', email: 'alice@example.com', age: 25 },
      { name: 'Bob', email: 'bob@example.com', age: 30 },
    ]);
    const result = await User.aggregate([
      { $group: { _id: null, avgAge: { $avg: '$age' } } },
    ]);
    expect(result[0].avgAge).toBe(27.5);
  });

  test('Should handle unique constraint violation', async () => {
    await User.create({ name: 'Sam', email: 'sam@example.com' });
    await expect(User.create({ name: 'Sam', email: 'sam@example.com' })).rejects.toThrow();
  });

  test('Should query geospatial data', async () => {
    await User.create({
      name: 'Geo User',
      email: 'geo@example.com',
      address: { coordinates: [77.1234, 28.7041] },
    });
    const nearbyUsers = await User.find({
      'address.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [77.1234, 28.7041] },
          $maxDistance: 1000,
        },
      },
    });
    expect(nearbyUsers.length).toBe(1);
    expect(nearbyUsers[0].name).toBe('Geo User');
  });
});
