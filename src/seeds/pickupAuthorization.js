import PickupAuthorization from '../models/PickupAuthorization.js';
import { fakeMappings } from './globalFakeMapping.js';
import User from '../models/User.js';
import School from '../models/School.js';

export default async function pickupAuthorizationSeed() {
  await PickupAuthorization.deleteMany({});

  const defaultSchool = await School.findOne({ active: true }).sort({
    created_at: 1,
  });
  const defaultStudent = await User.findOne({
    memberships: { $elemMatch: { role: 'student' } },
    active: true,
  }).sort({ created_at: 1 });
  const defaultResponsible = await User.findOne({
    memberships: { $elemMatch: { role: 'parent' } },
    active: true,
  }).sort({ created_at: 1 });

  if (!defaultSchool) {
    console.log(
      'Nenhuma escola ativa encontrada para seed de autorizações de retirada.',
    );
    return { insertedCount: 0 };
  }

  const authorizations = [];

  const defaultAuthorization = {
    school_id: defaultSchool._id,
    student_id: defaultStudent._id,
    authorized_by: defaultResponsible._id,
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
    const randomSchool = defaultSchool;
    const randomStudent = defaultStudent;
    const randomResponsible = defaultResponsible;
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
