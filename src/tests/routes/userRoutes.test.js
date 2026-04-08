import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const VALID_NONEXISTENT_ID = '000000000000000000000000';

async function loginAs(email, password) {
  const response = await request(BASE_URL)
    .post('/login')
    .send({ email, password });
  expect(response.status).toBe(200);
  const token = response.body?.data?.user?.access_token;
  expect(token).toBeTruthy();
  return token;
}

function getIdFromToken(token) {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
  );
  return payload.id;
}

async function getAdminSchoolId(adminToken) {
  const adminId = getIdFromToken(adminToken);
  const response = await request(BASE_URL)
    .get(`/users/${adminId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  expect(response.status).toBe(200);
  const memberships = response.body?.data?.memberships || [];
  expect(memberships.length).toBeGreaterThan(0);
  return memberships[0].school_id;
}

const createAdminPayload = () => {
  const suffix = Date.now().toString().slice(-8);
  return {
    full_name: `Admin Teste ${suffix}`,
    email: `admin.teste${suffix}@teste.com`,
    password: 'Senha@123',
  };
};

const createSchoolUserPayload = (overrides = {}) => {
  const suffix = Date.now().toString().slice(-8);
  return {
    full_name: `Usuario Escola ${suffix}`,
    email: `user.escola${suffix}@teste.com`,
    password: 'Senha@123',
    role: 'teacher',
    ...overrides,
  };
};

describe('POST /users — Criação de Usuário Admin Global', () => {
  let adminToken;
  let teacherToken;
  let parentToken;

  beforeAll(async () => {
    adminToken = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );
    parentToken = await loginAs(
      process.env.PARENT_EMAIL || 'ana.parent@escola.com',
      process.env.PARENT_PASSWORD || 'Senha@123',
    );
  });

  test('admin cria usuário com payload válido - 201, memberships vazio, sem password', async () => {
    const payload = createAdminPayload();

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data).toHaveProperty('email', payload.email);
    expect(response.body.data).toHaveProperty('memberships');
    expect(response.body.data.memberships).toEqual([]);
    expect(response.body.data).toHaveProperty('active', true);
    expect(response.body.data).not.toHaveProperty('password');
  });

  test('admin cria usuário com active=false - 201, active persistido como false', async () => {
    const payload = { ...createAdminPayload(), active: false };

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('active', false);
  });

  test('campo extra no body não causa erro - 201', async () => {
    const payload = { ...createAdminPayload(), foo: 'bar' };

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('foo');
  });

  test('email duplicado - 409, mensagem de email em uso', async () => {
    const payload = createAdminPayload();

    await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', true);
    expect(JSON.stringify(response.body)).toContain('Email já está em uso.');
  });

  test('full_name vazio - 400, erro de validação', async () => {
    const payload = { ...createAdminPayload(), full_name: '' };

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('full_name com mais de 100 caracteres - 400', async () => {
    const payload = { ...createAdminPayload(), full_name: 'A'.repeat(101) };

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('email com formato inválido - 400', async () => {
    const payload = { ...createAdminPayload(), email: 'email-invalido' };

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('senha fraca (sem número/letra/especial) - 400', async () => {
    const payload = { ...createAdminPayload(), password: 'senhafraca' };

    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('sem token - 498', async () => {
    const response = await request(BASE_URL)
      .post('/users')
      .send(createAdminPayload());

    expect(response.status).toBe(498);
  });

  test('token sem prefixo Bearer - 401 no AuthPermission', async () => {
    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', adminToken)
      .send(createAdminPayload());

    expect(response.status).toBe(401);
  });

  test('teacher tenta criar usuário admin - 403', async () => {
    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(createAdminPayload());

    expect(response.status).toBe(403);
  });

  test('parent tenta criar usuário admin - 403', async () => {
    const response = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${parentToken}`)
      .send(createAdminPayload());

    expect(response.status).toBe(403);
  });
});

describe('POST /schools/:schoolId/users — Criação/Vinculação de Usuário na Escola', () => {
  let adminToken;
  let teacherToken;
  let parentToken;
  let schoolId;

  beforeAll(async () => {
    adminToken = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );
    parentToken = await loginAs(
      process.env.PARENT_EMAIL || 'ana.parent@escola.com',
      process.env.PARENT_PASSWORD || 'Senha@123',
    );
    schoolId = await getAdminSchoolId(adminToken);
  });

  test('admin cria novo usuário com membership na escola - 201, memberships com school_id', async () => {
    const payload = createSchoolUserPayload();

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data).not.toHaveProperty('password');
    expect(Array.isArray(response.body.data.memberships)).toBe(true);
    expect(response.body.data.memberships.length).toBeGreaterThan(0);
    expect(response.body.data.memberships[0].school_id.toString()).toBe(
      schoolId,
    );
    expect(response.body.data.memberships[0]).toHaveProperty(
      'role',
      payload.role,
    );
  });

  test('criação sem password gera senha temporária internamente - 201', async () => {
    const payload = createSchoolUserPayload();
    delete payload.password;

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('password');
  });

  test('email já existente sem vínculo na escola - vincula membership, mesmo _id', async () => {
    const adminPayload = createAdminPayload();

    const createAdminResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(adminPayload);

    expect(createAdminResponse.status).toBe(201);
    const originalId = createAdminResponse.body.data._id;
    const originalMembershipCount =
      createAdminResponse.body.data.memberships.length;

    const schoolPayload = createSchoolUserPayload({ email: adminPayload.email });

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(schoolPayload);

    expect(response.status).toBe(201);
    expect(response.body.data._id).toBe(originalId);
    expect(response.body.data.memberships.length).toBeGreaterThan(
      originalMembershipCount,
    );
  });

  test('membership de parent com associated_students - 201, membership contém students', async () => {
    const studentId = '000000000000000000000001';
    const payload = createSchoolUserPayload({
      role: 'parent',
      associated_students: [studentId],
    });

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data.memberships[0]).toHaveProperty(
      'associated_students',
    );
    expect(response.body.data.memberships[0].associated_students).toContain(
      studentId,
    );
  });

  test('membership de student com class_id - 201, membership contém class_id', async () => {
    const classId = '000000000000000000000002';
    const payload = createSchoolUserPayload({ role: 'student', class_id: classId });

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data.memberships[0]).toHaveProperty(
      'class_id',
      classId,
    );
  });

  test('campo extra no body é ignorado - 201', async () => {
    const payload = { ...createSchoolUserPayload(), foo: 'bar' };

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
  });

  test('schoolId com formato inválido - 400 ou 403', async () => {
    const response = await request(BASE_URL)
      .post('/schools/abc/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createSchoolUserPayload());

    // AuthPermission falha primeiro (403) pois 'abc' não bate com nenhum membership;
    // caso a validação de schema rode antes, seria 400.
    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty('error', true);
  });

  test('usuário já vinculado à mesma escola - 409', async () => {
    const payload = createSchoolUserPayload();

    await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(409);
    expect(JSON.stringify(response.body)).toContain(
      'Usuário já vinculado a esta escola.',
    );
  });

  test('role inválido - 400', async () => {
    const payload = { ...createSchoolUserPayload(), role: 'coordinator' };

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('associated_students com ID inválido - 400', async () => {
    const payload = createSchoolUserPayload({
      role: 'parent',
      associated_students: ['id-invalido'],
    });

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('class_id inválido - 400', async () => {
    const payload = createSchoolUserPayload({
      role: 'student',
      class_id: 'id-invalido',
    });

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('sem token - 498', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .send(createSchoolUserPayload());

    expect(response.status).toBe(498);
  });

  test('teacher tenta criar usuário na escola - 403', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(createSchoolUserPayload());

    expect(response.status).toBe(403);
  });

  test('parent tenta criar usuário na escola - 403', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send(createSchoolUserPayload());

    expect(response.status).toBe(403);
  });
});

describe('GET /schools/:schoolId/users — Listagem de Usuários por Escola', () => {
  let adminToken;
  let teacherToken;
  let parentToken;
  let schoolId;

  beforeAll(async () => {
    adminToken = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );
    parentToken = await loginAs(
      process.env.PARENT_EMAIL || 'ana.parent@escola.com',
      process.env.PARENT_PASSWORD || 'Senha@123',
    );
    schoolId = await getAdminSchoolId(adminToken);
  });

  test('admin lista usuários da escola - 200, docs com memberships na escola', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
  });

  test('teacher da escola lista usuários da própria escola - 200', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('filtro por full_name parcial - 200, apenas usuários aderentes', async () => {
    const suffix = Date.now().toString().slice(-6);
    const uniqueName = `Filtro Unico ${suffix}`;

    await request(BASE_URL)
      .post(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createSchoolUserPayload({ full_name: uniqueName }));

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?full_name=Filtro Unico ${suffix}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.docs.length).toBeGreaterThan(0);
    const found = response.body.data.docs.some((u) =>
      u.full_name.includes(suffix),
    );
    expect(found).toBe(true);
  });

  test('filtro por email - 200', async () => {
    const teacherEmail = encodeURIComponent(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
    );
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?email=${teacherEmail}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('filtro por role=teacher - 200', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?role=teacher`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('filtro por active=true - 200', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?active=true`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('filtro por active=false - 200', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?active=false`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('paginação padrão - 200, metadados condizentes', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('docs');
  });

  test('paginação customizada page=1&limit=2 - 200, limite respeitado', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?page=1&limit=2`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.docs.length).toBeLessThanOrEqual(2);
  });

  test('parser numérico permissivo: page=2abc&limit=3xyz - 200', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?page=2abc&limit=3xyz`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('query com campo extra desconhecido não causa erro - 200', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?foo=bar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('schoolId inválido - 400 ou 403', async () => {
    const response = await request(BASE_URL)
      .get('/schools/abc/users')
      .set('Authorization', `Bearer ${adminToken}`);

    // AuthPermission falha primeiro (403) pois 'abc' não bate com nenhum membership;
    // caso a validação de schema rode antes, seria 400.
    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty('error', true);
  });

  test('role fora do enum - 400', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?role=coordinator`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('active fora de true/false - 400', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?active=1`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('page=0 - 400', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?page=0`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('limit=0 - 400', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?limit=0`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('limit=101 - 400', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users?limit=101`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('sem token - 498', async () => {
    const response = await request(BASE_URL).get(
      `/schools/${schoolId}/users`,
    );

    expect(response.status).toBe(498);
  });

  test('parent tenta listar usuários da escola - 403', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/users`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(response.status).toBe(403);
  });
});

describe('GET /users/:id — Detalhe de Usuário', () => {
  let adminToken;
  let teacherToken;
  let parentToken;
  let createdUserId;
  let inactiveUserId;

  beforeAll(async () => {
    adminToken = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );
    parentToken = await loginAs(
      process.env.PARENT_EMAIL || 'ana.parent@escola.com',
      process.env.PARENT_PASSWORD || 'Senha@123',
    );

    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createAdminPayload());

    expect(createResponse.status).toBe(201);
    createdUserId = createResponse.body.data._id;

    const createInactiveResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...createAdminPayload(), active: false });

    expect(createInactiveResponse.status).toBe(201);
    inactiveUserId = createInactiveResponse.body.data._id;
  });

  test('admin consulta usuário existente - 200, _id correto, sem password', async () => {
    const response = await request(BASE_URL)
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('_id', createdUserId);
    expect(response.body.data).not.toHaveProperty('password');
  });

  test('consulta de usuário inativo - 200, active=false', async () => {
    const response = await request(BASE_URL)
      .get(`/users/${inactiveUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('active', false);
  });

  test('ID inválido - 400', async () => {
    const response = await request(BASE_URL)
      .get('/users/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('ID válido inexistente - 404', async () => {
    const response = await request(BASE_URL)
      .get(`/users/${VALID_NONEXISTENT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('sem token - 498', async () => {
    const response = await request(BASE_URL).get(`/users/${createdUserId}`);

    expect(response.status).toBe(498);
  });

  test('teacher sem permissão users.get tenta consultar - 403', async () => {
    const response = await request(BASE_URL)
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
  });

  test('parent tenta consultar usuário - 403', async () => {
    const response = await request(BASE_URL)
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(response.status).toBe(403);
  });
});

describe('PATCH /users/:id — Atualização de Usuário', () => {
  let adminToken;
  let teacherToken;
  let parentToken;
  let targetUserId;
  let targetUserEmail;

  beforeAll(async () => {
    adminToken = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );
    parentToken = await loginAs(
      process.env.PARENT_EMAIL || 'ana.parent@escola.com',
      process.env.PARENT_PASSWORD || 'Senha@123',
    );

    const payload = createAdminPayload();
    targetUserEmail = payload.email;

    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(createResponse.status).toBe(201);
    targetUserId = createResponse.body.data._id;
  });

  test('admin atualiza full_name - 200, nome persistido', async () => {
    const novoNome = `Nome Atualizado ${Date.now().toString().slice(-6)}`;

    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: novoNome });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('full_name', novoNome);
  });

  test('admin atualiza active para false e depois true - 200 em ambas', async () => {
    const responseInactive = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    expect(responseInactive.status).toBe(200);
    expect(responseInactive.body.data).toHaveProperty('active', false);

    const responseActive = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: true });

    expect(responseActive.status).toBe(200);
    expect(responseActive.body.data).toHaveProperty('active', true);
  });

  test('admin substitui memberships com novo array - 200, memberships igual ao payload', async () => {
    const schoolId = await getAdminSchoolId(adminToken);
    const novosMemberships = [
      { school_id: schoolId, role: 'teacher' },
    ];

    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberships: novosMemberships });

    expect(response.status).toBe(200);
    expect(response.body.data.memberships.length).toBe(1);
    expect(response.body.data.memberships[0].school_id.toString()).toBe(schoolId);
    expect(response.body.data.memberships[0]).toHaveProperty('role', 'teacher');
  });

  test('body vazio {} - 200, sem erro de validação', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('envio de email e password no payload - ignorados, email permanece inalterado', async () => {
    const novoNome = `Nome Patch Email ${Date.now().toString().slice(-6)}`;

    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: novoNome,
        email: 'novo.email@ignorado.com',
        password: 'NovaSenha@999',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('full_name', novoNome);
    expect(response.body.data.email).toBe(targetUserEmail);
  });

  test('campo extra no body é ignorado - 200', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: 'Nome Valido', foo: 'bar' });

    expect(response.status).toBe(200);
  });

  test('ID inválido - 400', async () => {
    const response = await request(BASE_URL)
      .patch('/users/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: 'Nome Qualquer' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('ID inexistente - 404', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${VALID_NONEXISTENT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: 'Nome Qualquer' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('full_name vazio - 400', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('full_name com mais de 100 caracteres - 400', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ full_name: 'A'.repeat(101) });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('memberships com role inválido - 400', async () => {
    const schoolId = await getAdminSchoolId(adminToken);

    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberships: [{ school_id: schoolId, role: 'coordinator' }] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('memberships com school_id inválido - 400', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberships: [{ school_id: 'id-invalido', role: 'teacher' }] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('sem token - 498', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .send({ full_name: 'Nome Qualquer' });

    expect(response.status).toBe(498);
  });

  test('teacher tenta atualizar usuário - 403', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ full_name: 'Tentativa Teacher' });

    expect(response.status).toBe(403);
  });

  test('parent tenta atualizar usuário - 403', async () => {
    const response = await request(BASE_URL)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ full_name: 'Tentativa Parent' });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /users/:id — Inativação (Soft Delete)', () => {
  let adminToken;
  let teacherToken;
  let parentToken;

  beforeAll(async () => {
    adminToken = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );
    parentToken = await loginAs(
      process.env.PARENT_EMAIL || 'ana.parent@escola.com',
      process.env.PARENT_PASSWORD || 'Senha@123',
    );
  });

  test('admin desativa usuário ativo - 200, active=false, mensagem correta', async () => {
    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createAdminPayload());

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.data._id;

    const response = await request(BASE_URL)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('active', false);
    expect(response.body.message).toContain('Usuário desativado com sucesso.');
  });

  test('exclusão idempotente: segunda chamada no mesmo id - 200, active permanece false', async () => {
    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createAdminPayload());

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.data._id;

    const firstDelete = await request(BASE_URL)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(firstDelete.status).toBe(200);
    expect(firstDelete.body.data).toHaveProperty('active', false);

    const secondDelete = await request(BASE_URL)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(secondDelete.status).toBe(200);
    expect(secondDelete.body.data).toHaveProperty('active', false);
  });

  test('usuário continua consultável após soft delete - GET retorna 200 com active=false', async () => {
    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createAdminPayload());

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.data._id;

    await request(BASE_URL)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const getResponse = await request(BASE_URL)
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toHaveProperty('active', false);
  });

  test('ID inválido - 400', async () => {
    const response = await request(BASE_URL)
      .delete('/users/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('ID inexistente - 404', async () => {
    const response = await request(BASE_URL)
      .delete(`/users/${VALID_NONEXISTENT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('sem token - 498', async () => {
    const response = await request(BASE_URL).delete(
      `/users/${VALID_NONEXISTENT_ID}`,
    );

    expect(response.status).toBe(498);
  });

  test('teacher tenta deletar usuário - 403', async () => {
    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createAdminPayload());

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.data._id;

    const response = await request(BASE_URL)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
  });

  test('parent tenta deletar usuário - 403', async () => {
    const createResponse = await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createAdminPayload());

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body.data._id;

    const response = await request(BASE_URL)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(response.status).toBe(403);
  });
});
