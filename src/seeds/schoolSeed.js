import School from '../models/School.js';
import { fakeMappings } from './globalFakeMapping.js';
import seedRotas from './rotasSeed.js';
import seedGrupos from './grupoSeed.js';

export default async function schoolSeed() {
  await School.deleteMany({});

  const rotasCompletas = await seedRotas();
  const grupos = await seedGrupos(rotasCompletas);
  const schoolGroup = grupos.find((g) => g.nome === 'School');

  const schools = [];
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
