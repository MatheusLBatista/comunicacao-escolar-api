import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
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

async function loginAndGetToken() {
  const response = await request(BASE_URL)
    .post('/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL || 'admin@admin.com',
      password: process.env.ADMIN_PASSWORD || 'Senha@123',
    });

  expect(response.status).toBe(200);

  const token = response.body?.data?.user?.access_token;
  expect(token).toBeTruthy();

  return token;
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

async function getOrCreateSchoolUser({ token, schoolId, role, seedLabel }) {
  const listResponse = await request(BASE_URL)
    .get(`/schools/${schoolId}/users`)
    .query({ role, limit: 1 })
    .set('Authorization', `Bearer ${token}`);

  expect(listResponse.status).toBe(200);

  const firstUser = listResponse.body?.data?.docs?.[0];
  if (firstUser?._id) {
    return firstUser._id;
  }

  const seed = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const createResponse = await request(BASE_URL)
    .post(`/schools/${schoolId}/users`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: `${seedLabel} ${seed}`,
      email: `${seedLabel.toLowerCase()}.${seed}@teste.com`,
      password: 'Senha@123',
      role,
      active: true,
    });

  expect(createResponse.status).toBe(201);
  expect(createResponse.body?.data?._id).toBeTruthy();

  return createResponse.body.data._id;
}

async function getOrCreateDailyLogTemplate({ token, schoolId }) {
  const listResponse = await request(BASE_URL)
    .get('/daily-log-templates')
    .query({ school_id: schoolId, limit: 1 })
    .set('Authorization', `Bearer ${token}`);

  expect(listResponse.status).toBe(200);

  const firstTemplate = listResponse.body?.data?.docs?.[0];
  if (firstTemplate?._id) {
    return { id: firstTemplate._id, createdBySuite: false };
  }

  const payload = {
    school_id: schoolId,
    fields: [
      {
        key: 'mood_status',
        label: 'Disposicao',
        type: 'select',
        options: ['Feliz', 'Neutro', 'Cansado'],
      },
      {
        key: 'observation',
        label: 'Observacao',
        type: 'text',
      },
    ],
    ativo: true,
  };

  const createResponse = await request(BASE_URL)
    .post('/daily-log-templates')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  expect(createResponse.status).toBe(201);
  expect(createResponse.body?.data?._id).toBeTruthy();

  return { id: createResponse.body.data._id, createdBySuite: true };
}

describe('DailyLog - integração de rotas', () => {
  let token;
  let schoolId;
  let teacherId;
  let studentId;
  let dailyLogTemplateId;
  let templateCreatedBySuite = false;

  let createdDailyLogId;
  const createdDailyLogIds = [];

  beforeAll(async () => {
    token = await loginAndGetToken();
    schoolId = await getFirstSchoolId(token);

    teacherId = await getOrCreateSchoolUser({
      token,
      schoolId,
      role: 'teacher',
      seedLabel: 'TeacherDailyLog',
    });

    studentId = await getOrCreateSchoolUser({
      token,
      schoolId,
      role: 'student',
      seedLabel: 'StudentDailyLog',
    });

    const template = await getOrCreateDailyLogTemplate({ token, schoolId });
    dailyLogTemplateId = template.id;
    templateCreatedBySuite = template.createdBySuite;
  });

  afterAll(async () => {
    for (const id of createdDailyLogIds) {
      await request(BASE_URL)
        .delete(`/daily-logs/${id}`)
        .set('Authorization', `Bearer ${token}`);
    }

    if (templateCreatedBySuite && dailyLogTemplateId) {
      await request(BASE_URL)
        .delete(`/daily-log-templates/${dailyLogTemplateId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });

  test('deve retornar 401/498 ao criar daily log sem token', async () => {
    const response = await request(BASE_URL).post('/daily-logs').send({
      school_id: schoolId,
      student_id: studentId,
      teacher_id: teacherId,
      dailylogtemplate_id: dailyLogTemplateId,
      is_present: true,
      date: new Date().toISOString(),
    });

    expect([401, 498]).toContain(response.status);
  });

  test('deve criar daily log com payload válido', async () => {
    const payload = {
      school_id: schoolId,
      student_id: studentId,
      teacher_id: teacherId,
      dailylogtemplate_id: dailyLogTemplateId,
      is_present: true,
      entries: [
        {
          field_key: 'mood_status',
          value: 'Feliz',
        },
      ],
      attachments: [],
      date: new Date().toISOString(),
      observation: 'Aluno participou bem das atividades.',
      ativo: true,
    };

    const response = await request(BASE_URL)
      .post('/daily-logs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expectSuccessEnvelope(response);

    expect(response.body.data).toHaveProperty('_id');
    expect(asId(response.body.data.school_id)).toBe(schoolId);
    expect(asId(response.body.data.student_id)).toBe(studentId);
    expect(asId(response.body.data.teacher_id)).toBe(teacherId);
    expect(asId(response.body.data.dailylogtemplate_id)).toBe(
      dailyLogTemplateId,
    );
    expect(response.body.data).toHaveProperty('is_present', true);
    expect(response.body.data).toHaveProperty(
      'observation',
      payload.observation,
    );
    expect(response.body.data).toHaveProperty('ativo', true);

    createdDailyLogId = response.body.data._id;
    createdDailyLogIds.push(createdDailyLogId);
  });

  test('deve retornar 400 ao criar daily log sem campos obrigatórios', async () => {
    const response = await request(BASE_URL)
      .post('/daily-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        school_id: schoolId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve listar daily logs com paginação', async () => {
    const response = await request(BASE_URL)
      .get('/daily-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(Array.isArray(response.body?.data?.docs)).toBe(true);
    expect(response.body.data).toHaveProperty('totalDocs');
    expect(response.body.data).toHaveProperty('page');
    expect(response.body.data).toHaveProperty('limit');
  });

  test('deve filtrar daily logs por school_id e student_id', async () => {
    const response = await request(BASE_URL)
      .get('/daily-logs')
      .query({ school_id: schoolId, student_id: studentId, limit: 100 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);

    const docs = response.body?.data?.docs || [];
    expect(Array.isArray(docs)).toBe(true);

    const found = docs.find((item) => item._id === createdDailyLogId);
    expect(found).toBeTruthy();
  });

  test('deve retornar 400 ao listar com school_id inválido', async () => {
    const response = await request(BASE_URL)
      .get('/daily-logs')
      .query({ school_id: 'abc' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve buscar daily log por ID', async () => {
    expect(createdDailyLogId).toBeTruthy();

    const response = await request(BASE_URL)
      .get(`/daily-logs/${createdDailyLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdDailyLogId);
  });

  test('deve retornar 400 ao buscar daily log com ID inválido', async () => {
    const response = await request(BASE_URL)
      .get('/daily-logs/abc')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve atualizar daily log por PATCH', async () => {
    const payload = {
      is_present: false,
      observation: `Atualizado via patch ${Date.now()}`,
    };

    const response = await request(BASE_URL)
      .patch(`/daily-logs/${createdDailyLogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdDailyLogId);
    expect(response.body.data).toHaveProperty('is_present', false);
    expect(response.body.data).toHaveProperty(
      'observation',
      payload.observation,
    );
  });

  test('deve atualizar daily log por PUT (mesmo handler de PATCH)', async () => {
    const payload = {
      is_present: true,
      ativo: false,
    };

    const response = await request(BASE_URL)
      .put(`/daily-logs/${createdDailyLogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdDailyLogId);
    expect(response.body.data).toHaveProperty('is_present', true);
    expect(response.body.data).toHaveProperty('ativo', false);
  });

  test('deve marcar daily log como lido', async () => {
    const response = await request(BASE_URL)
      .patch(`/daily-logs/${createdDailyLogId}/read`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdDailyLogId);
    expect(response.body.data.read_at).toBeTruthy();
    expect(Number.isNaN(new Date(response.body.data.read_at).getTime())).toBe(
      false,
    );
  });

  test('deve filtrar daily logs com read=true', async () => {
    const response = await request(BASE_URL)
      .get('/daily-logs')
      .query({ read: true, limit: 100 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);

    const docs = response.body?.data?.docs || [];
    const found = docs.find((item) => item._id === createdDailyLogId);
    expect(found).toBeTruthy();
    expect(found.read_at).toBeTruthy();
  });

  test('deve retornar 404 ao atualizar daily log inexistente', async () => {
    const response = await request(BASE_URL)
      .patch('/daily-logs/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ observation: 'Inexistente' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 401/498 ao deletar daily log sem token', async () => {
    const response = await request(BASE_URL).delete(
      `/daily-logs/${createdDailyLogId}`,
    );

    expect([401, 498]).toContain(response.status);
  });

  test('deve deletar daily log por ID', async () => {
    const response = await request(BASE_URL)
      .delete(`/daily-logs/${createdDailyLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);

    const index = createdDailyLogIds.indexOf(createdDailyLogId);
    if (index >= 0) {
      createdDailyLogIds.splice(index, 1);
    }
  });

  test('deve retornar 404 ao buscar daily log removido', async () => {
    const response = await request(BASE_URL)
      .get(`/daily-logs/${createdDailyLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });
});
