import DailyLogTemplate from '../models/DailyLogTemplate.js';
import School from '../models/School.js';
import User from '../models/User.js';

function buildBaseFields() {
  return [
    {
      key: 'mood_status',
      label: 'Disposicao',
      type: 'select',
      options: ['Feliz', 'Neutro', 'Triste'],
    },
    {
      key: 'participation',
      label: 'Participacao nas atividades',
      type: 'select',
      options: ['Alta', 'Media', 'Baixa'],
    },
    {
      key: 'food_intake',
      label: 'Alimentacao',
      type: 'select',
      options: ['Comeu bem', 'Comeu pouco', 'Recusou'],
    },
    {
      key: 'observation',
      label: 'Observacoes',
      type: 'text',
      options: [],
    },
  ];
}

function buildStudentSpecificFields() {
  return [
    {
      key: 'therapy_followup',
      label: 'Acompanhamento terapeutico',
      type: 'boolean',
      options: [],
    },
    {
      key: 'individual_goal',
      label: 'Meta individual do dia',
      type: 'text',
      options: [],
    },
  ];
}

export default async function dailyLogTemplateSeed() {
  await DailyLogTemplate.deleteMany({});

  const school = await School.findOne({ active: true }).sort({ created_at: 1 });

  if (!school) {
    console.log('Nenhuma escola ativa encontrada para seed de templates.');
    return { insertedCount: 0 };
  }

  const students = await User.find({
    active: true,
    memberships: {
      $elemMatch: {
        school_id: school._id,
        role: 'student',
      },
    },
  }).limit(2);

  const templates = [
    {
      school_id: school._id,
      student_id: null,
      fields: buildBaseFields(),
      ativo: true,
    },
  ];

  for (const student of students) {
    templates.push({
      school_id: school._id,
      student_id: student._id,
      fields: [...buildBaseFields(), ...buildStudentSpecificFields()],
      ativo: true,
    });
  }

  const result = await DailyLogTemplate.collection.insertMany(templates);

  console.log(`Seeded ${result.insertedCount} daily log templates.`);

  return {
    insertedCount: result.insertedCount,
    schoolId: school._id,
  };
}
