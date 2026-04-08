import School from '../models/School.js';

export default async function schoolSeed() {
  await School.deleteMany({});

  const defaultSchool = {
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

  const result = await School.collection.insertOne(defaultSchool);

  return { defaultSchool, result };
}
