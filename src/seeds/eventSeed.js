import Event from '../models/Event.js';
import User from '../models/User.js';

const EVENT_TYPES = ['event', 'meeting', 'commemorative', 'pedagogical'];
const EVENT_TITLES = {
  event: ['Passeio pedagógico', 'Feira de ciências', 'Mostra cultural'],
  meeting: ['Reunião de pais', 'Conselho de classe', 'Alinhamento pedagógico'],
  commemorative: ['Dia das Mães', 'Festa Junina', 'Semana da Criança'],
  pedagogical: ['Formação docente', 'Planejamento bimestral', 'Oficina didática'],
};

export default async function eventSeed(schools, users) {
  await Event.deleteMany({});

  const eventsPerSchool = Number(process.env.EVENTS_PER_SCHOOL) || 4;
  const schoolIds = extractSchoolIds(schools, users);

  if (schoolIds.length === 0) {
    console.log('Nenhuma escola válida encontrada para criação de eventos.');
    return { insertedCount: 0, events: [] };
  }

  const creators = await User.find({
    memberships: {
      $elemMatch: {
        school_id: { $in: schoolIds },
        role: { $in: ['admin', 'teacher'] },
      },
    },
    active: true,
  })
    .select('_id memberships')
    .lean();

  const students = await User.find({
    memberships: {
      $elemMatch: {
        school_id: { $in: schoolIds },
        role: 'student',
      },
    },
    active: true,
  })
    .select('memberships')
    .lean();

  const classIdsBySchool = buildClassIdsBySchool(students);
  const events = [];

  for (const schoolId of schoolIds) {
    const creatorsInSchool = creators.filter((user) =>
      user.memberships?.some(
        (membership) =>
          String(membership.school_id) === String(schoolId) &&
          ['admin', 'teacher'].includes(membership.role),
      ),
    );

    if (creatorsInSchool.length === 0) {
      continue;
    }

    const classIds = classIdsBySchool.get(String(schoolId)) || [];

    for (let index = 0; index < eventsPerSchool; index++) {
      const creator = randomItem(creatorsInSchool);
      const type = randomItem(EVENT_TYPES);
      const startDate = buildStartDate(index);
      const isAllDay = type === 'commemorative' ? true : Math.random() >= 0.5;
      const hasClassTarget = classIds.length > 0 && Math.random() >= 0.5;

      let endDate = null;
      if (!isAllDay) {
        endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
      }

      events.push({
        school_id: schoolId,
        title: randomItem(EVENT_TITLES[type]),
        description: `Evento do tipo ${type} para agenda escolar.`,
        type,
        start_date: startDate,
        end_date: endDate,
        all_day: isAllDay,
        target: {
          scope: hasClassTarget ? 'class' : 'all',
          target_id: hasClassTarget ? randomItem(classIds) : null,
        },
        created_by: creator._id,
        active: true,
      });
    }
  }

  if (events.length === 0) {
    console.log(
      'Nenhum evento foi criado: não há usuários com papel admin/teacher nas escolas recebidas.',
    );
    return { insertedCount: 0, events: [] };
  }

  const result = await Event.collection.insertMany(events);

  console.log(`Seeded ${result.insertedCount} events.`);

  return { insertedCount: result.insertedCount, events };
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function buildStartDate(index) {
  const baseDate = new Date();
  baseDate.setHours(8, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() + index + 1);
  return baseDate;
}

function buildClassIdsBySchool(students) {
  const map = new Map();

  for (const student of students) {
    for (const membership of student.memberships || []) {
      if (membership.role !== 'student' || !membership.school_id) continue;
      if (!membership.class_id) continue;

      const schoolKey = String(membership.school_id);
      const classId = membership.class_id;

      if (!map.has(schoolKey)) {
        map.set(schoolKey, []);
      }

      const existingClassIds = map.get(schoolKey);
      if (!existingClassIds.some((id) => String(id) === String(classId))) {
        existingClassIds.push(classId);
      }
    }
  }

  return map;
}

function extractSchoolIds(schools, users) {
  const ids = [];

  if (Array.isArray(schools)) {
    ids.push(...schools.map((school) => school?._id).filter(Boolean));
  }

  if (schools?.result?.insertedIds) {
    ids.push(...Object.values(schools.result.insertedIds));
  }

  if (schools?.schools && Array.isArray(schools.schools)) {
    ids.push(...schools.schools.map((school) => school?._id).filter(Boolean));
  }

  if (schools?.schoolId) {
    ids.push(schools.schoolId);
  }

  if (users?.schoolId) {
    ids.push(users.schoolId);
  }

  return [...new Set(ids.map(String))];
}