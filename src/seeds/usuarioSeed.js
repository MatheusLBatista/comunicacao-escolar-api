import Usuario from '../models/Usuario.js';
import Escola from '../models/Escola.js';
import { fakeMappings } from './globalFakeMapping.js';
import bcrypt from 'bcrypt';
import seedRotas from './rotasSeed.js';
import seedGrupos from './grupoSeed.js';

export default async function usuarioSeed() {
  await Usuario.deleteMany({});
  await Escola.deleteMany({});

  const rotasCompletas = await seedRotas();
  const grupos = await seedGrupos(rotasCompletas);
  const grupoUsuario = grupos.find((g) => g.nome === 'Usuario');

  // MOCK: Criar escola padrão
  const escola = await Escola.create({
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

  const senhaPadrao = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'Senha@123',
    10,
  );

  // MOCK: Criar alunos
  const alunos = [];
  for (let i = 0; i < 5; i++) {
    alunos.push({
      full_name: fakeMappings.Usuario.full_name(),
      email: fakeMappings.Usuario.email(),
      password: senhaPadrao,
      active: true,
      permissions: grupoUsuario?.permissions || [],
      groups: grupoUsuario ? [grupoUsuario._id] : [],
      memberships: [
        {
          school_id: escola._id,
          role: 'student',
          class_id: fakeMappings.Usuario.class_id(),
        },
      ],
    });
  }

  const alunosCriados = await Usuario.collection.insertMany(alunos);
  const alunoIds = Object.values(alunosCriados.insertedIds);

  // Criar admin
  const admin = {
    full_name: process.env.ADMIN_NAME || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@admin.com',
    password: senhaPadrao,
    active: true,
    permissions: rotasCompletas.map((r) => r.toObject()),
    groups: grupos[0] ? [grupos[0]._id] : [],
    memberships: [
      {
        school_id: escola._id,
        role: 'admin',
      },
    ],
  };

  // Criar professores (teachers)
  const professores = [];
  for (let i = 0; i < 3; i++) {
    professores.push({
      full_name: fakeMappings.Usuario.full_name(),
      email: fakeMappings.Usuario.email(),
      password: senhaPadrao,
      active: true,
      permissions: grupoUsuario?.permissions || [],
      groups: grupoUsuario ? [grupoUsuario._id] : [],
      memberships: [
        {
          school_id: escola._id,
          role: 'teacher',
        },
      ],
    });
  }

  // Criar responsáveis (parents)
  const responsaveis = [];
  for (let i = 0; i < 3; i++) {
    // Cada responsável vinculado a 1-2 alunos
    const estudantesVinculados = alunoIds.slice(
      i,
      Math.min(i + 2, alunoIds.length),
    );

    responsaveis.push({
      full_name: fakeMappings.Usuario.full_name(),
      email: fakeMappings.Usuario.email(),
      password: senhaPadrao,
      active: true,
      permissions: grupoUsuario?.permissions || [],
      groups: grupoUsuario ? [grupoUsuario._id] : [],
      memberships: [
        {
          school_id: escola._id,
          role: 'parent',
          associated_students: estudantesVinculados,
        },
      ],
    });
  }

  // Inserir todos os usuários
  const todosUsuarios = [admin, ...professores, ...responsaveis];
  const result = await Usuario.collection.insertMany(todosUsuarios);

  const adminCriado = await Usuario.findOne({
    email: process.env.ADMIN_EMAIL || 'admin@admin.com',
  });

  console.log(`Escola criada: ${escola.nome} (${escola._id})`);
  console.log(`Admin: ${adminCriado.email}`);
  console.log(`${professores.length} professores criados`);
  console.log(`${responsaveis.length} responsáveis criados`);
  console.log(`${alunos.length} alunos criados`);

  return {
    adminId: adminCriado._id,
    escolaId: escola._id,
    usuarios: result,
  };
}
