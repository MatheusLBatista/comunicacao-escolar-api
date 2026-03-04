import User from '../models/User.js';
import School from '../models/School.js';
import { fakeMappings } from './globalFakeMapping.js';
import bcrypt from 'bcrypt';
import seedRotas from './rotasSeed.js';
import seedGrupos from './grupoSeed.js';

export default async function userSeed() {
  await User.deleteMany({});
  await School.deleteMany({});

  const rotasCompletas = await seedRotas();
  const grupos = await seedGrupos(rotasCompletas);
  const userGroup = grupos.find((g) => g.nome === 'User');

  // MOCK: Create default school
  const school = await School.create({
    nome: 'Escola ComunicaAlunos',
    cnpj: '12.345.678/0001-90',
    endereco: {
      logradouro: 'Rua Principal, 100',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001-000',
    },
    ativo: true,
  });

  const defaultPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'Senha@123',
    10,
  );

  // MOCK: Create students
  const students = [];
  for (let i = 0; i < 5; i++) {
    students.push({
      full_name: fakeMappings.User.full_name(),
      email: fakeMappings.User.email(),
      password: defaultPassword,
      active: true,
      permissions: userGroup?.permissions || [],
      groups: userGroup ? [userGroup._id] : [],
      memberships: [
        {
          school_id: school._id,
          role: 'student',
          class_id: fakeMappings.User.class_id(),
        },
      ],
    });
  }

  const createdStudents = await User.collection.insertMany(students);
  const studentIds = Object.values(createdStudents.insertedIds);

  // Create admin
  const admin = {
    full_name: process.env.ADMIN_NAME || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@admin.com',
    password: defaultPassword,
    active: true,
    permissions: rotasCompletas.map((r) => r.toObject()),
    groups: grupos[0] ? [grupos[0]._id] : [],
    memberships: [
      {
        school_id: school._id,
        role: 'admin',
      },
    ],
  };

  // Create teachers
  const teachers = [];
  for (let i = 0; i < 3; i++) {
    teachers.push({
      full_name: fakeMappings.User.full_name(),
      email: fakeMappings.User.email(),
      password: defaultPassword,
      active: true,
      permissions: userGroup?.permissions || [],
      groups: userGroup ? [userGroup._id] : [],
      memberships: [
        {
          school_id: school._id,
          role: 'teacher',
        },
      ],
    });
  }

  // Create parents
  const parents = [];
  for (let i = 0; i < 3; i++) {
    // Each parent linked to 1-2 students
    const linkedStudents = studentIds.slice(
      i,
      Math.min(i + 2, studentIds.length),
    );

    parents.push({
      full_name: fakeMappings.User.full_name(),
      email: fakeMappings.User.email(),
      password: defaultPassword,
      active: true,
      permissions: userGroup?.permissions || [],
      groups: userGroup ? [userGroup._id] : [],
      memberships: [
        {
          school_id: school._id,
          role: 'parent',
          associated_students: linkedStudents,
        },
      ],
    });
  }

  // Insert all users
  const allUsers = [admin, ...teachers, ...parents];
  const result = await User.collection.insertMany(allUsers);

  const createdAdmin = await User.findOne({
    email: process.env.ADMIN_EMAIL || 'admin@admin.com',
  });

  console.log(`School created: ${school.nome} (${school._id})`);
  console.log(`Admin: ${createdAdmin.email}`);
  console.log(`${teachers.length} teachers created`);
  console.log(`${parents.length} parents created`);
  console.log(`${students.length} students created`);

  return {
    adminId: createdAdmin._id,
    schoolId: school._id,
    users: result,
  };
}
