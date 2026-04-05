import Class from '../models/Class.js';
import School from '../models/School.js';
import User from '../models/User.js';

const CLASS_TEMPLATES = [
  { name: 'Turma A', grade: '1 ano' },
  { name: 'Turma B', grade: '2 ano' },
  { name: 'Turma C', grade: '3 ano' },
];

export default async function classSeed() {
  await Class.deleteMany({});

  const schools = await School.find({ active: true }).select('_id').lean();

  if (!schools.length) {
    console.log('Nenhuma escola ativa encontrada para seed de turmas.');
    return { insertedCount: 0, classes: [] };
  }

  const schoolIds = schools.map((school) => school._id);

  const teachers = await User.find({
    active: true,
    memberships: {
      $elemMatch: {
        school_id: { $in: schoolIds },
        role: 'teacher',
      },
    },
  })
    .select('_id memberships')
    .lean();

  const teachersBySchool = new Map();

  for (const teacher of teachers) {
    for (const membership of teacher.memberships || []) {
      if (membership.role !== 'teacher' || !membership.school_id) continue;

      const schoolKey = String(membership.school_id);

      if (!teachersBySchool.has(schoolKey)) {
        teachersBySchool.set(schoolKey, []);
      }

      teachersBySchool.get(schoolKey).push(teacher._id);
    }
  }

  const classes = [];
  const year = new Date().getFullYear();

  for (const school of schools) {
    const schoolTeacherIds = teachersBySchool.get(String(school._id)) || [];

    if (!schoolTeacherIds.length) {
      continue;
    }

    CLASS_TEMPLATES.forEach((template, index) => {
      const primaryTeacher = schoolTeacherIds[index % schoolTeacherIds.length];
      const secondaryTeacher =
        schoolTeacherIds.length > 1
          ? schoolTeacherIds[(index + 1) % schoolTeacherIds.length]
          : null;

      const teacherIds = secondaryTeacher
        ? [primaryTeacher, secondaryTeacher]
        : [primaryTeacher];

      classes.push({
        school_id: school._id,
        name: template.name,
        grade: template.grade,
        year,
        teacher_ids: teacherIds,
        active: true,
      });
    });
  }

  if (!classes.length) {
    console.log(
      'Nenhuma turma foi criada: faltam professores ativos vinculados a escolas ativas.',
    );
    return { insertedCount: 0, classes: [] };
  }

  const result = await Class.collection.insertMany(classes);

  console.log(`Seeded ${result.insertedCount} classes.`);

  return {
    insertedCount: result.insertedCount,
    classes,
  };
}