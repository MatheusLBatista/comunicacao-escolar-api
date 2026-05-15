import mongoose from 'mongoose';
import PickupLog from '../models/PickupLog.js';
import PickupAuthorization from '../models/PickupAuthorization.js';
import User from '../models/User.js';
import School from '../models/School.js';
import { fakeMappings } from './globalFakeMapping.js';

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildDepartureTime(offsetDays = 0) {
  const date = new Date();
  date.setHours(17, 0, 0, 0);
  date.setDate(date.getDate() - offsetDays);
  return date;
}

function resolveUserSchoolId(user) {
  return user?.memberships?.[0]?.school_id || null;
}

export default async function pickupLogSeed() {
  await PickupLog.deleteMany({});

  const schools = await School.find({ active: true }).sort({ created_at: 1 });
  const students = await User.find({
    active: true,
    memberships: { $elemMatch: { role: 'student' } },
  })
    .select('_id full_name memberships')
    .sort({ created_at: 1 })
    .lean();
  const verifiers = await User.find({
    active: true,
    memberships: { $elemMatch: { role: { $in: ['admin', 'teacher'] } } },
  })
    .select('_id memberships')
    .sort({ created_at: 1 })
    .lean();
  const parents = await User.find({
    active: true,
    memberships: { $elemMatch: { role: 'parent' } },
  })
    .select('_id full_name memberships')
    .sort({ created_at: 1 })
    .lean();
  const authorizations = await PickupAuthorization.find({ active: true })
    .select('_id school_id student_id authorized_person used')
    .sort({ created_at: 1 })
    .lean();

  if (!schools.length) {
    console.log('Nenhuma escola ativa encontrada para seed de pickup logs.');
    return { insertedCount: 0, pickupLogs: [] };
  }

  if (!students.length) {
    console.log('Nenhum aluno ativo encontrado para seed de pickup logs.');
    return { insertedCount: 0, pickupLogs: [] };
  }

  if (!verifiers.length) {
    console.log(
      'Nenhum usuário admin/teacher ativo encontrado para seed de pickup logs.',
    );
    return { insertedCount: 0, pickupLogs: [] };
  }

  const pickupLogs = [];
  const defaultSchool = schools[0];
  const defaultStudent = students.find(
    (student) =>
      String(resolveUserSchoolId(student)) === String(defaultSchool._id),
  );
  const defaultVerifier = verifiers.find(
    (verifier) =>
      String(resolveUserSchoolId(verifier)) === String(defaultSchool._id),
  );

  if (!defaultStudent || !defaultVerifier) {
    console.log(
      'Não foi possível montar pickup logs padrão: faltam aluno/verificador na escola padrão.',
    );
    return { insertedCount: 0, pickupLogs: [] };
  }

  const defaultAuthorization = authorizations.find(
    (authorization) =>
      String(authorization.school_id) === String(defaultSchool._id) &&
      String(authorization.student_id) === String(defaultStudent._id),
  );

  pickupLogs.push({
    _id: new mongoose.Types.ObjectId('664dfe006070809010201001'),
    school_id: defaultSchool._id,
    student_id: defaultStudent._id,
    authorization_id: defaultAuthorization?._id || null,
    picked_up_by: {
      user_id: null,
      name:
        defaultAuthorization?.authorized_person?.name || 'Responsavel Padrao',
      document:
        defaultAuthorization?.authorized_person?.document || '000.000.000-00',
    },
    method: defaultAuthorization ? 'qr_code' : 'manual',
    departure_time: buildDepartureTime(0),
    verified_by: defaultVerifier._id,
    notes: 'Registro padrao de retirada.',
    active: true,
  });

  const totalLogs = Number(process.env.PICKUP_LOGS_TOTAL) || 12;

  for (let i = 1; i < totalLogs; i++) {
    const randomStudent = randomItem(students);
    const studentSchoolId = resolveUserSchoolId(randomStudent);

    if (!studentSchoolId) {
      continue;
    }

    const verifiersInSchool = verifiers.filter(
      (verifier) =>
        String(resolveUserSchoolId(verifier)) === String(studentSchoolId),
    );

    if (!verifiersInSchool.length) {
      continue;
    }

    const randomVerifier = randomItem(verifiersInSchool);
    const authorizationCandidate = authorizations.find(
      (authorization) =>
        String(authorization.school_id) === String(studentSchoolId) &&
        String(authorization.student_id) === String(randomStudent._id),
    );

    const parentCandidate = parents.find(
      (parent) =>
        String(resolveUserSchoolId(parent)) === String(studentSchoolId),
    );

    const useAuthorization = Boolean(authorizationCandidate);

    pickupLogs.push({
      school_id: studentSchoolId,
      student_id: randomStudent._id,
      authorization_id: useAuthorization ? authorizationCandidate._id : null,
      picked_up_by: {
        user_id: parentCandidate?._id || null,
        name:
          authorizationCandidate?.authorized_person?.name ||
          parentCandidate?.full_name ||
          fakeMappings.PickupAuthorization.authorized_person.name(),
        document:
          authorizationCandidate?.authorized_person?.document ||
          fakeMappings.PickupAuthorization.authorized_person.document(),
      },
      method: useAuthorization ? 'qr_code' : 'manual',
      departure_time: buildDepartureTime(i % 7),
      verified_by: randomVerifier._id,
      notes: `Registro de retirada #${i}`,
      active: true,
    });
  }

  if (!pickupLogs.length) {
    console.log('Nenhum pickup log foi montado para insercao.');
    return { insertedCount: 0, pickupLogs: [] };
  }

  const result = await PickupLog.collection.insertMany(pickupLogs);

  console.log(`Seeded ${result.insertedCount} pickup logs.`);

  return { insertedCount: result.insertedCount, pickupLogs };
}
