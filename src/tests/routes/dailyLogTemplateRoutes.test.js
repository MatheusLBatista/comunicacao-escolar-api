import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const asId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id;
  return null;
};

const expectSuccessEnvelope = (response) => {
  expect(response.body).toHaveProperty('error', false);
  expect(response.body).toHaveProperty('data');
};

async function loginWithCredentials(email, password) {
  const response = await request(BASE_URL).post('/auth/login').send({
    email,
    password,
  });

  expect(response.status).toBe(200);

  const token = response.body?.data?.user?.access_token;
  expect(token).toBeTruthy();

  return token;
}

async function loginAndGetToken() {
  return loginWithCredentials('admin@admin.com', 'Senha@123');
}

async function getFirstSchoolId(token) {
  const response = await request(BASE_URL)
    .get('/schools')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);

  const schools = response.body?.data?.docs || [];
  const firstSchoolId = schools[0]?._id;
  expect(firstSchoolId).toBeTruthy();

  return firstSchoolId;
}

async function createGlobalUser({ token, seedLabel }) {
  const seed = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${seedLabel.toLowerCase()}.${seed}@teste.com`;
  const password = 'Senha@123';

  const response = await request(BASE_URL)
    .post('/users')
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: `${seedLabel} ${seed}`,
      email,
      password,
      active: true,
    });

  expect(response.status).toBe(201);
  expect(response.body?.data?._id).toBeTruthy();

  return {
    id: response.body.data._id,
    email,
    password,
  };
}

async function createSchoolUser({ token, schoolId, role, seedLabel }) {
  const seed = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${seedLabel.toLowerCase()}.${seed}@teste.com`;
  const password = 'Senha@123';

  const response = await request(BASE_URL)
    .post(`/schools/${schoolId}/users`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: `${seedLabel} ${seed}`,
      email,
      password,
      role,
      active: true,
    });

  expect(response.status).toBe(201);
  expect(response.body?.data?._id).toBeTruthy();

  return {
    id: response.body.data._id,
    email,
    password,
  };
}

async function createDailyLogTemplate({
  token,
  schoolId,
  studentId = null,
  ativo = true,
  labelSeed = 'Template',
}) {
  const seed = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const response = await request(BASE_URL)
    .post('/daily-log-templates')
    .set('Authorization', `Bearer ${token}`)
    .send({
      school_id: schoolId,
      name: `${labelSeed} ${seed}`,
      student_id: studentId,
      fields: [
        {
          key: `mood_${seed}`,
          label: `${labelSeed} ${seed}`,
          type: 'select',
          options: ['Feliz', 'Neutro', 'Cansado'],
        },
        {
          key: `note_${seed}`,
          label: `Observacao ${seed}`,
          type: 'text',
        },
      ],
      ativo,
      ignored_field: 'nao_deve_persistir',
    });

  expect(response.status).toBe(201);
  expectSuccessEnvelope(response);

  const createdId = response.body?.data?._id;
  expect(createdId).toBeTruthy();
  expect(response.body.data).not.toHaveProperty('ignored_field');

  return {
    id: createdId,
    data: response.body.data,
  };
}

describe('DailyLogTemplate - integração de rotas', () => {
  let adminToken;
  let schoolId;
  let studentUser;
  let teacherUser;
  let teacherToken;
  let createdTemplate;
  const templateIdsToCleanup = [];

  beforeAll(async () => {
    adminToken = await loginAndGetToken();
    schoolId = await getFirstSchoolId(adminToken);

    studentUser = await createSchoolUser({
      token: adminToken,
      schoolId,
      role: 'student',
      seedLabel: 'StudentDailyLogTemplate',
    });

    teacherUser = await createGlobalUser({
      token: adminToken,
      seedLabel: 'TeacherDailyLogTemplate',
    });

    teacherToken = await loginWithCredentials(
      teacherUser.email,
      teacherUser.password,
    );

    createdTemplate = await createDailyLogTemplate({
      token: adminToken,
      schoolId,
      labelSeed: 'TemplateBase',
    });
    templateIdsToCleanup.push(createdTemplate.id);

    const inactiveTemplate = await createDailyLogTemplate({
      token: adminToken,
      schoolId,
      ativo: false,
      labelSeed: 'TemplateInativo',
    });
    templateIdsToCleanup.push(inactiveTemplate.id);

    const studentTemplate = await createDailyLogTemplate({
      token: adminToken,
      schoolId,
      studentId: studentUser.id,
      labelSeed: 'TemplateStudent',
    });
    templateIdsToCleanup.push(studentTemplate.id);
  });

  afterAll(async () => {
    for (const id of templateIdsToCleanup) {
      await request(BASE_URL)
        .delete(`/daily-log-templates/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  test('deve bloquear a criacao sem token', async () => {
    const response = await request(BASE_URL).post('/daily-log-templates').send({
      school_id: schoolId,
      fields: [
        {
          key: 'mood',
          label: 'Disposicao',
          type: 'text',
        },
      ],
    });

    expect([401, 498]).toContain(response.status);
  });

  test('deve criar template com payload valido e ignorar campo extra', async () => {
    const response = await request(BASE_URL)
      .post('/daily-log-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        school_id: schoolId,
        name: 'Template Participacao',
        fields: [
          {
            key: 'participation',
            label: 'Participacao',
            type: 'select',
            options: ['Alta', 'Media', 'Baixa'],
          },
        ],
        ativo: true,
        extra_payload: 'deve_ser_ignorado',
      });

    expect(response.status).toBe(201);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id');
    expect(asId(response.body.data.school_id)).toBe(schoolId);
    expect(response.body.data).toHaveProperty('ativo', true);
    expect(response.body.data.fields).toHaveLength(1);
    expect(response.body.data.fields[0]).toHaveProperty('type', 'select');
    expect(response.body.data.fields[0]).toHaveProperty('options');
    expect(Array.isArray(response.body.data.fields[0].options)).toBe(true);
    expect(response.body.data).not.toHaveProperty('extra_payload');

    templateIdsToCleanup.push(response.body.data._id);
  });

  test('deve retornar 400 ao criar template sem fields', async () => {
    const response = await request(BASE_URL)
      .post('/daily-log-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        school_id: schoolId,
        fields: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 400 ao criar template com select sem options', async () => {
    const response = await request(BASE_URL)
      .post('/daily-log-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        school_id: schoolId,
        fields: [
          {
            key: 'mood',
            label: 'Disposicao',
            type: 'select',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 400 ao criar template com school_id invalido', async () => {
    const response = await request(BASE_URL)
      .post('/daily-log-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        school_id: 'abc',
        fields: [
          {
            key: 'mood',
            label: 'Disposicao',
            type: 'text',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve listar templates com paginação e filtros', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ school_id: schoolId, page: 1, limit: 10 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(Array.isArray(response.body?.data?.docs)).toBe(true);
    expect(response.body.data).toHaveProperty('totalDocs');
    expect(response.body.data).toHaveProperty('page', 1);
    expect(response.body.data).toHaveProperty('limit', 10);

    const docs = response.body?.data?.docs || [];
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((doc) => asId(doc.school_id) === schoolId)).toBe(true);
  });

  test('deve filtrar templates por student_id', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ student_id: studentUser.id, limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);

    const docs = response.body?.data?.docs || [];
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((doc) => asId(doc.student_id) === studentUser.id)).toBe(
      true,
    );
  });

  test('deve filtrar templates por ativo=true e ativo=false', async () => {
    const activeResponse = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ ativo: true, limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(activeResponse.status).toBe(200);
    expectSuccessEnvelope(activeResponse);
    expect(
      (activeResponse.body?.data?.docs || []).every((doc) => doc.ativo === true),
    ).toBe(true);

    const inactiveResponse = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ ativo: false, limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(inactiveResponse.status).toBe(200);
    expectSuccessEnvelope(inactiveResponse);
    expect(
      (inactiveResponse.body?.data?.docs || []).every(
        (doc) => doc.ativo === false,
      ),
    ).toBe(true);
  });

  test('deve aceitar query extra sem falhar', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ foo: 'bar' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
  });

  test('deve retornar 400 ao listar com page invalida', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ page: 0 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 400 ao listar com school_id invalido', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ school_id: 'abc' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve bloquear token sem Bearer no AuthPermission', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .set('Authorization', adminToken);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve negar acesso para usuario sem permissao ativa', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve buscar template por id', async () => {
    const response = await request(BASE_URL)
      .get(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdTemplate.id);
    expect(asId(response.body.data.school_id)).toBe(schoolId);
    expect(Array.isArray(response.body.data.fields)).toBe(true);
  });

  test('deve retornar 400 ao buscar template com id invalido', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 404 ao buscar template inexistente', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve atualizar fields do template por PATCH', async () => {
    const payload = {
      fields: [
        {
          key: 'participation',
          label: 'Participacao atualizada',
          type: 'select',
          options: ['Alta', 'Media'],
        },
      ],
      extra_update: 'nao_deve_persistir',
    };

    const response = await request(BASE_URL)
      .patch(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdTemplate.id);
    expect(response.body.data.fields).toHaveLength(1);
    expect(response.body.data.fields[0]).toHaveProperty(
      'label',
      payload.fields[0].label,
    );
    expect(response.body.data.fields[0]).toHaveProperty('options');
    expect(response.body.data).not.toHaveProperty('extra_update');
  });

  test('deve retornar 400 ao atualizar template com fields vazio', async () => {
    const response = await request(BASE_URL)
      .patch(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fields: [] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 400 ao atualizar template com select sem options', async () => {
    const response = await request(BASE_URL)
      .patch(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fields: [
          {
            key: 'mood',
            label: 'Disposicao',
            type: 'select',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve aceitar body vazio no PATCH', async () => {
    const response = await request(BASE_URL)
      .patch(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdTemplate.id);
  });

  test('deve negar acesso ao PATCH para usuario sem permissao', async () => {
    const response = await request(BASE_URL)
      .patch(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        fields: [
          {
            key: 'mood',
            label: 'Disposicao',
            type: 'text',
          },
        ],
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve deletar template e impedir nova exclusao', async () => {
    const response = await request(BASE_URL)
      .delete(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdTemplate.id);

    const secondDelete = await request(BASE_URL)
      .delete(`/daily-log-templates/${createdTemplate.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(secondDelete.status).toBe(404);
    expect(secondDelete.body).toHaveProperty('error', true);
  });

  test('deve remover template da listagem apos delete', async () => {
    const response = await request(BASE_URL)
      .get('/daily-log-templates')
      .query({ school_id: schoolId, limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);

    const docs = response.body?.data?.docs || [];
    const deletedTemplate = docs.find((doc) => doc._id === createdTemplate.id);
    expect(deletedTemplate).toBeUndefined();
  });
});