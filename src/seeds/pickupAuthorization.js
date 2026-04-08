import PickupAuthorization from '../models/PickupAuthorization.js';
import { fakeMappings } from './globalFakeMapping.js';
import User from '../models/User.js';
import School from '../models/School.js';

export default async function pickupAuthorizationSeed() {
  await PickupAuthorization.deleteMany({});

  const schools = await School.find({ active: true }).sort({
    created_at: 1,
  });
  const students = await User.find({
    memberships: { $elemMatch: { role: 'student' } },
    active: true,
  }).sort({ created_at: 1 });
  const parents = await User.find({
    memberships: { $elemMatch: { role: 'parent' } },
    active: true,
  }).sort({ created_at: 1 });

  if (!schools.length) {
    console.log(
      'Nenhuma escola ativa encontrada para seed de autorizações de retirada.',
    );
    return { insertedCount: 0 };
  }

  if (!students.length) {
    console.log(
      'Nenhum aluno ativo encontrado para seed de autorizações de retirada.',
    );
    return { insertedCount: 0 };
  }

  if (!parents.length) {
    console.log(
      'Nenhum responsável ativo encontrado para seed de autorizações de retirada.',
    );
    return { insertedCount: 0 };
  }

  const authorizations = [];
  const defaultSchool = schools[0];
  const defaultStudent = students[0];
  const defaultParent = parents[0];

  const defaultAuthorization = {
    school_id: defaultSchool._id,
    student_id: defaultStudent._id,
    authorized_by: defaultParent._id,
    authorized_person: {
      name: 'Maria da Silva',
      document: '123.456.789-00',
      relationship: 'Avó',
      photo_url: null,
    },
    qr_code: 'DEFAULT-QR-001',
    valid_from: new Date(),
    valid_until: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    used: false,
    active: true,
  };

  authorizations.push(defaultAuthorization);

  for (let i = 0; i < 10; i++) {
    const randomSchool = schools[Math.floor(Math.random() * schools.length)];
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const randomResponsible =
      parents[Math.floor(Math.random() * parents.length)];
    const map = fakeMappings.PickupAuthorization;

    authorizations.push({
      school_id: randomSchool._id,
      student_id: randomStudent._id,
      authorized_by: randomResponsible._id,
      authorized_person: {
        name: map.authorized_person.name(),
        document: map.authorized_person.document(),
        relationship: map.authorized_person.relationship(),
        photo_url: null,
      },
      qr_code: map.qr_code(),
      valid_from: map.valid_from(),
      valid_until: map.valid_until(),
      used: map.used(),
      active: map.active(),
    });
  }

  const result =
    await PickupAuthorization.collection.insertMany(authorizations);

  console.log(`Seeded ${result.insertedCount} pickup authorizations.`);

  return { authorizations, result };
}
