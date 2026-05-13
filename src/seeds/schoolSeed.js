import mongoose from 'mongoose';
import School from '../models/School.js';

export default async function schoolSeed() {
  await School.deleteMany({});

  // Escola principal — usada em todos os fluxos (posts, turmas, conversas, etc.)
  const defaultSchool = {
    _id: new mongoose.Types.ObjectId('6642a3f7b4c5d6e7f8091001'),
    name: 'Escola Comunica Alunos',
    tax_id: '12345678000190',
    address: {
      street: 'Rua Principal',
      number: '333',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01001000',
    },
    active: true,
  };

  // Escola auxiliar — criada exclusivamente para demonstrar o DELETE na Swagger
  const deleteSchool = {
    _id: new mongoose.Types.ObjectId('6642a3f7b4c5d6e7f8091099'),
    name: 'Escola Demo Delete',
    tax_id: '99999999000199',
    address: {
      street: 'Rua Auxiliar',
      number: '1',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01001001',
    },
    active: true,
  };

  const result = await School.collection.insertMany([
    defaultSchool,
    deleteSchool,
  ]);

  console.log(`Main school: ${defaultSchool.name} (${defaultSchool._id})`);
  console.log(`Delete school: ${deleteSchool.name} (${deleteSchool._id})`);

  return { defaultSchool, deleteSchool, result };
}
