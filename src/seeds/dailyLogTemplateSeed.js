import DailyLogTemplate from '../models/DailyLogTemplate.js';
import School from '../models/School.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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
      _id: new mongoose.Types.ObjectId('6648f9ed1020304050607001'),
      school_id: school._id,
      student_id: null,
      name: 'Diário de Bordo Padrão',
      fields: buildBaseFields(),
      ativo: true,
    },
  ];

  for (const [i, student] of students.entries()) {
    templates.push({
      school_id: school._id,
      student_id: student._id,
      name: `Diário Individual ${i + 1}`,
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
