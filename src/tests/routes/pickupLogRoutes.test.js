import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

function buildObjectId() {
  return '507f1f77bcf86cd799439011';
}

function buildPickupLogPayload({
  schoolId,
  studentId,
  verifierId,
  parentId,
  authorizationId = null,
  method = 'manual',
}) {
  return {
    school_id: schoolId,
    student_id: studentId,
    authorization_id: authorizationId,
    picked_up_by: {
      user_id: parentId,
      name: 'Responsavel Teste',
      document: `${Date.now()}`,
    },
    method,
    departure_time: new Date().toISOString(),
    verified_by: verifierId,
    notes: 'Teste de criacao pickup log',
    active: true,
  };
}

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

async function createSchoolUser({ token, schoolId, role, fullName, email }) {
  const payload = {
    full_name: fullName,
    email,
    role,
    password: 'Senha@123',
    active: true,
  };

  const response = await request(BASE_URL)
    .post(`/schools/${schoolId}/users`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('error', false);
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('_id');

  return response.body.data._id;
}

async function createPickupAuthorization({
  token,
  schoolId,
  studentId,
  parentId,
}) {
  const now = new Date();
  const validFrom = new Date(now.getTime() + 60 * 60 * 1000);
  const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const payload = {
    school_id: schoolId,
    student_id: studentId,
    authorized_by: parentId,
    authorized_person: {
      name: 'Autorizado Integracao',
      document: String(Date.now()).slice(2),
      relationship: 'Tia',
      photo_url: null,
    },
    qr_code: `pickup-qr-${Date.now()}`,
    valid_from: validFrom.toISOString(),
    valid_until: validUntil.toISOString(),
    used: false,
    active: true,
  };

  const response = await request(BASE_URL)
    .post('/pickup-authorizations')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('error', false);
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('_id');

  return response.body.data._id;
}

describe('PickupLog - integração de rotas', () => {
  let token;
  let schoolId;
  let studentId;
  let teacherId;
  let parentId;
  let authorizationId;
  let createdPickupLogId;
  let qrPickupLogId;

  beforeAll(async () => {
    token = await loginAndGetToken();
    schoolId = await getFirstSchoolId(token);

    const seed = Date.now();

    studentId = await createSchoolUser({
      token,
      schoolId,
      role: 'student',
      fullName: `Aluno PickupLog ${seed}`,
      email: `student.pickuplog.${seed}@teste.com`,
    });

    teacherId = await createSchoolUser({
      token,
      schoolId,
      role: 'teacher',
      fullName: `Professor PickupLog ${seed}`,
      email: `teacher.pickuplog.${seed}@teste.com`,
    });

    parentId = await createSchoolUser({
      token,
      schoolId,
      role: 'parent',
      fullName: `Responsavel PickupLog ${seed}`,
      email: `parent.pickuplog.${seed}@teste.com`,
    });

    authorizationId = await createPickupAuthorization({
      token,
      schoolId,
      studentId,
      parentId,
    });
  });

  test('deve retornar 401 ao listar pickup logs sem token', async () => {
    const response = await request(BASE_URL).get('/pickup-logs');

    expect([401, 498]).toContain(response.status);
  });

  test('deve criar pickup log com payload válido', async () => {
    const payload = buildPickupLogPayload({
      schoolId,
      studentId,
      verifierId: teacherId,
      parentId,
      method: 'manual',
    });

    const response = await request(BASE_URL)
      .post('/pickup-logs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data).toHaveProperty('school_id', schoolId);
    expect(response.body.data).toHaveProperty('student_id', studentId);
    expect(response.body.data).toHaveProperty('verified_by', teacherId);
    expect(response.body.data).toHaveProperty('method', 'manual');

    createdPickupLogId = response.body.data._id;
  });

  test('deve criar pickup log com método qr_code e authorization_id', async () => {
    const payload = buildPickupLogPayload({
      schoolId,
      studentId,
      verifierId: teacherId,
      parentId,
      authorizationId,
      method: 'qr_code',
    });

    const response = await request(BASE_URL)
      .post('/pickup-logs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('method', 'qr_code');
    expect(response.body.data).toHaveProperty(
      'authorization_id',
      authorizationId,
    );

    qrPickupLogId = response.body.data._id;
  });

  test('deve listar pickup logs com token', async () => {
    const response = await request(BASE_URL)
      .get('/pickup-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
    expect(response.body.data.docs.length).toBeGreaterThan(0);
  });

  test('deve listar pickup logs filtrando por school_id e method', async () => {
    const response = await request(BASE_URL)
      .get('/pickup-logs')
      .query({ school_id: schoolId, method: 'manual', page: 1, limit: 20 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
    expect(
      response.body.data.docs.some((d) => d._id === createdPickupLogId),
    ).toBe(true);
  });

  test('deve buscar pickup log por id', async () => {
    expect(createdPickupLogId).toBeTruthy();

    const response = await request(BASE_URL)
      .get(`/pickup-logs/${createdPickupLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('_id', createdPickupLogId);
  });

  test('deve retornar 422 ao criar pickup log com verified_by sem role admin/teacher', async () => {
    const payload = buildPickupLogPayload({
      schoolId,
      studentId,
      verifierId: parentId,
      parentId,
      method: 'manual',
    });

    const response = await request(BASE_URL)
      .post('/pickup-logs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'Apenas usuários com role admin ou teacher podem validar retirada.',
    );
  });

  test('deve retornar 422 ao criar pickup log com qr_code sem authorization_id', async () => {
    const payload = buildPickupLogPayload({
      schoolId,
      studentId,
      verifierId: teacherId,
      parentId,
      authorizationId: null,
      method: 'qr_code',
    });

    const response = await request(BASE_URL)
      .post('/pickup-logs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'authorization_id é obrigatório para retirada com método qr_code.',
    );
  });

  test('deve retornar 400 ao buscar pickup log com id inválido', async () => {
    const response = await request(BASE_URL)
      .get('/pickup-logs/id-invalido')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve atualizar pickup log por PATCH', async () => {
    const response = await request(BASE_URL)
      .patch(`/pickup-logs/${createdPickupLogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Registro atualizado no teste',
        active: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('_id', createdPickupLogId);
    expect(response.body.data).toHaveProperty(
      'notes',
      'Registro atualizado no teste',
    );
    expect(response.body.data).toHaveProperty('active', false);
  });

  test('deve atualizar pickup log com patch parcial de picked_up_by', async () => {
    const response = await request(BASE_URL)
      .patch(`/pickup-logs/${createdPickupLogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        picked_up_by: {
          name: 'Responsavel Atualizado',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('_id', createdPickupLogId);
    expect(response.body.data).toHaveProperty('picked_up_by');
    expect(response.body.data.picked_up_by).toHaveProperty(
      'name',
      'Responsavel Atualizado',
    );
    expect(response.body.data.picked_up_by).toHaveProperty('document');
  });

  test('deve retornar 422 ao atualizar para qr_code sem authorization_id', async () => {
    const response = await request(BASE_URL)
      .patch(`/pickup-logs/${createdPickupLogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        method: 'qr_code',
        authorization_id: null,
      });

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'authorization_id é obrigatório para retirada com método qr_code.',
    );
  });

  test('deve retornar 404 ao atualizar pickup log inexistente', async () => {
    const response = await request(BASE_URL)
      .patch(`/pickup-logs/${buildObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'nao deve atualizar' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve deletar pickup log', async () => {
    const response = await request(BASE_URL)
      .delete(`/pickup-logs/${createdPickupLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('deve retornar 401 ao deletar pickup log sem token', async () => {
    const response = await request(BASE_URL).delete(
      `/pickup-logs/${qrPickupLogId}`,
    );

    expect([401, 498]).toContain(response.status);
  });

  test('deve deletar pickup log qr_code', async () => {
    const response = await request(BASE_URL)
      .delete(`/pickup-logs/${qrPickupLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('deve retornar 404 ao buscar pickup log removido', async () => {
    const response = await request(BASE_URL)
      .get(`/pickup-logs/${createdPickupLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 404 ao deletar pickup log inexistente', async () => {
    const response = await request(BASE_URL)
      .delete(`/pickup-logs/${buildObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });
});
