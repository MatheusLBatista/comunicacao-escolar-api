import { vi, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DbConnect from './src/config/DbConnect.js';
import schoolSeed from './src/seeds/schoolSeed.js';
import userSeed from './src/seeds/userSeed.js';
import postSeed from './src/seeds/postSeed.js';
import classSeed from './src/seeds/classSeed.js';
import dailyLogTemplateSeed from './src/seeds/dailyLogTemplateSeed.js';
import dailyLogSeed from './src/seeds/dailyLogSeed.js';
import conversationSeed from './src/seeds/conversationSeed.js';
import messageSeed from './src/seeds/messageSeed.js';
import pickupAuthorizationSeed from './src/seeds/pickupAuthorization.js';
import pickupLogSeed from './src/seeds/pickupLogSeed.js';
import eventSeed from './src/seeds/eventSeed.js';
import likeSeed from './src/seeds/likeSeed.js';
import auditLogSeed from './src/seeds/auditLogSeed.js';
import linkStudentsToClasses from './src/seeds/linkStudentsToClasses.js';

dotenv.config();

process.env.NODE_ENV = 'test';

let mongod;

// Mock do MinIO para evitar problemas nos testes
vi.mock('./src/config/MinIO.js', () => ({
  default: {
    putObject: vi.fn().mockResolvedValue({
      etag: 'mocked-etag',
      versionId: null,
    }),
    bucketExists: vi.fn().mockResolvedValue(true),
    makeBucket: vi.fn().mockResolvedValue(),
    setBucketPolicy: vi.fn().mockResolvedValue(),
  },
}));

// Mock do SharpConfig para evitar problemas nos testes
vi.mock('./src/config/SharpConfig.js', () => ({
  default: vi.fn().mockImplementation((buffer) => Promise.resolve(buffer)),
}));

beforeAll(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  // Setup MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.DB_URL = uri;

  // Connect and Seed
  await DbConnect.conectar();
  
  const schools = await schoolSeed();
  const users = await userSeed();
  await classSeed();
  await linkStudentsToClasses();
  await postSeed(schools, users);
  await likeSeed();
  await dailyLogTemplateSeed();
  await dailyLogSeed();
  await conversationSeed();
  await messageSeed();
  await pickupAuthorizationSeed();
  await pickupLogSeed();
  await eventSeed(schools, users);
  await auditLogSeed(schools, users);
  
  // We keep the connection open for the tests
}, 60000); // Increased timeout for seeding

afterAll(async () => {
  vi.restoreAllMocks();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});
