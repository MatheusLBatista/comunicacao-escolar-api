import mongoose from 'mongoose';
import DailyLog from '../models/DailyLog.js';
import DailyLogTemplate from '../models/DailyLogTemplate.js';
import School from '../models/School.js';
import User from '../models/User.js';

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function buildEntries(isPresent) {
  if (!isPresent) {
    return [
      {
        field_key: 'absence_reason',
        value: 'Faltou por motivo de saúde.',
      },
    ];
  }

  const moods = ['feliz', 'neutro', 'cansado'];
  const participation = ['alta', 'media', 'baixa'];
  const meals = ['comeu bem', 'comeu pouco', 'recusou parte da refeicao'];

  return [
    {
      field_key: 'mood_status',
      value: getRandomItem(moods),
    },
    {
      field_key: 'participation',
      value: getRandomItem(participation),
    },
    {
      field_key: 'food_intake',
      value: getRandomItem(meals),
    },
  ];
}

export default async function dailyLogSeed() {
  await DailyLog.deleteMany({});

  const school = await School.findOne({ active: true }).sort({ created_at: 1 });

  if (!school) {
    console.log('Nenhuma escola ativa encontrada para seed de daily logs.');
    return { insertedCount: 0 };
  }

  const [students, teachers] = await Promise.all([
    User.find({
      active: true,
      memberships: {
        $elemMatch: {
          school_id: school._id,
          role: 'student',
        },
      },
    }),
    User.find({
      active: true,
      memberships: {
        $elemMatch: {
          school_id: school._id,
          role: 'teacher',
        },
      },
    }),
  ]);

  const templates = await DailyLogTemplate.find({
    school_id: school._id,
    ativo: true,
  });

  if (!students.length || !teachers.length || !templates.length) {
    console.log(
      'Seed de daily logs ignorada: faltam alunos, professores ou templates para a escola ativa.',
    );
    return { insertedCount: 0 };
  }

  const logs = [];
  const studentsToSeed = students.slice(0, 5);
  const daysToSeed = 5;

  for (const student of studentsToSeed) {
    for (let dayOffset = 0; dayOffset < daysToSeed; dayOffset++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - dayOffset);

      const isPresent = Math.random() >= 0.2;
      const teacher = getRandomItem(teachers);
      const template = getRandomItem(templates);

      logs.push({
        school_id: school._id,
        student_id: student._id,
        teacher_id: teacher._id,
        dailylogtemplate_id: template._id,
        is_present: isPresent,
        entries: buildEntries(isPresent),
        attachments: [],
        read_at: null,
        date,
        ativo: true,
      });
    }
  }

  // Primeiro log — ID fixo para facilitar exemplos na Swagger
  if (logs.length > 0) {
    logs[0]._id = new mongoose.Types.ObjectId('6649faee2030405060708001');
  }

  const result = await DailyLog.collection.insertMany(logs);

  console.log(`Seeded ${result.insertedCount} daily logs.`);

  return {
    insertedCount: result.insertedCount,
    schoolId: school._id,
  };
}
