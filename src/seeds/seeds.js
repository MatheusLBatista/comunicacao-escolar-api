import mongoose from 'mongoose';
import DbConnect from '../config/DbConnect.js';
import schoolSeed from './schoolSeed.js';

await DbConnect.conectar();

try {
  console.log(
    `[${new Date().toLocaleString()}] - Iniciando criação das seeds...`,
  );

  // await userSeed();
  await schoolSeed();

  console.log(`[${new Date().toLocaleString()}] - Seeds criadas com sucesso!`);
} catch (error) {
  console.error('Erro ao criar seeds:', error);
} finally {
  mongoose.connection.close();
  process.exit(0);
}
