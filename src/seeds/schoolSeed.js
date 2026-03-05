import School from '../models/School';
import { fakeMappings } from './globalFakeMapping';
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
      address: {
        street: fakeMappings.School.address.street(),
        city: fakeMappings.School.address.city(),
        state: fakeMappings.School.address.state(),
        zip_code: fakeMappings.School.address.zip_code(),
      },
      active: true,
    });
  }

  const result = await School.collection.insertMany(schools);

  console.log(`Seeded ${result.insertedCount} schools.`);

  return { schools, result };
}
