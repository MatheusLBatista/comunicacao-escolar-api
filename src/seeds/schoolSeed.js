import School from '../models/School.js';
import { fakeMappings } from './globalFakeMapping.js';

export default async function schoolSeed() {
  await School.deleteMany({});

  const schools = [];

  const defaultSchool = {
    name: 'Escola Comunica Alunos',
    tax_id: '12345678000190',
    address: {
      street: 'Rua Principal, 100',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01001000',
    },
    active: true,
  };

  schools.push(defaultSchool);

  for (let i = 0; i < 5; i++) {
    schools.push({
      name: fakeMappings.School.name(),
      tax_id: fakeMappings.School.tax_id(),
      address: fakeMappings.School.address(),
      active: true,
    });
  }

  const result = await School.collection.insertMany(schools);

  console.log(`Seeded ${result.insertedCount} schools.`);

  return { schools, result };
}
