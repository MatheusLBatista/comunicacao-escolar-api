import mongoose from 'mongoose';
import DbConnect from '../config/DbConnect.js';
import schoolSeed from './schoolSeed.js';
import userSeed from './userSeed.js';
import postSeed from './postSeed.js';
import classSeed from './classSeed.js';

import dailyLogTemplateSeed from './dailyLogTemplateSeed.js';
import dailyLogSeed from './dailyLogSeed.js';
import conversationSeed from './conversationSeed.js';
import messageSeed from './messageSeed.js';
import pickupAuthorizationSeed from './pickupAuthorization.js';
import eventSeed from './eventSeed.js';

await DbConnect.conectar();

try {
  console.log(
    `[${new Date().toLocaleString()}] - Iniciando criação das seeds...`,
  );

  const schools = await schoolSeed();
  const users = await userSeed();
  await classSeed();
  await postSeed(schools, users);
  await dailyLogTemplateSeed();
  await dailyLogSeed();
  await conversationSeed();
  await messageSeed();
  await pickupAuthorizationSeed();
  await eventSeed(schools, users);

  console.log(`[${new Date().toLocaleString()}] - Seeds criadas com sucesso!`);
} catch (error) {
  console.error('Erro ao criar seeds:', error);
} finally {
  mongoose.connection.close();
  process.exit(0);
}
