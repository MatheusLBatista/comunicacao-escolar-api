import User from '../models/User.js';
import Class from '../models/Class.js';

export default async function linkStudentsToClasses() {
  const classes = await Class.find({ active: true }).select('_id').lean();

  if (classes.length === 0) {
    console.log(
      'Seed de vinculação de alunos ignorada: nenhuma turma encontrada.',
    );
    return { updatedCount: 0 };
  }

  const students = await User.find({
    memberships: { $elemMatch: { role: 'student' } },
  });

  if (students.length === 0) {
    console.log(
      'Seed de vinculação de alunos ignorada: nenhum aluno encontrado.',
    );
    return { updatedCount: 0 };
  }

  let updatedCount = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const classId = classes[i % classes.length]._id;

    // Atualizar o membership do aluno com a class_id real
    student.memberships.forEach((m) => {
      if (m.role === 'student') {
        m.class_id = classId;
      }
    });

    await student.save();
    updatedCount++;
  }

  console.log(`Linked ${updatedCount} students to classes.`);
  return { updatedCount };
}
