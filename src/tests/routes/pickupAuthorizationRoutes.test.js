import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

async function loginAndGetToken() {
  const response = await request(BASE_URL)
    .post('/login')
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

describe('PickupAuthorization - integração de rotas', () => {
  let token;
  let schoolId;
  let studentId;
  let parentId;
  let createdPickupAuthorizationId;

  beforeAll(async () => {
    token = await loginAndGetToken();
    schoolId = await getFirstSchoolId(token);

    const seed = Date.now();
    studentId = await createSchoolUser({
      token,
      schoolId,
      role: 'student',
      fullName: `Aluno Integração ${seed}`,
      email: `student.pickup.${seed}@teste.com`,
    });

    parentId = await createSchoolUser({
      token,
      schoolId,
      role: 'parent',
      fullName: `Responsável Integração ${seed}`,
      email: `parent.pickup.${seed}@teste.com`,
    });
  });

  test('deve retornar 401 ao listar pickup authorizations sem token', async () => {
    const response = await request(BASE_URL).get('/pickup-authorizations');

    expect([401, 498]).toContain(response.status);
  });

  test('deve criar pickup authorization com payload válido', async () => {
    const now = new Date();
    const validFrom = new Date(now.getTime() + 60 * 60 * 1000);
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const payload = {
      school_id: schoolId,
      student_id: studentId,
      authorized_by: parentId,
      authorized_person: {
        name: 'Maria Ferreira',
        document: `${Date.now()}`,
        relationship: 'Tia',
        photo_url: null,
      },
      qr_code: `pickup-qrcode-${Date.now()}`,
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
    expect(response.body.data).toHaveProperty('school_id', schoolId);
    expect(response.body.data).toHaveProperty('student_id', studentId);
    expect(response.body.data).toHaveProperty('authorized_by', parentId);

    createdPickupAuthorizationId = response.body.data._id;
  });

  test('deve listar pickup authorizations com token', async () => {
    const response = await request(BASE_URL)
      .get('/pickup-authorizations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
  });

  test('deve buscar pickup authorization por id', async () => {
    expect(createdPickupAuthorizationId).toBeTruthy();

    const response = await request(BASE_URL)
      .get(`/pickup-authorizations/${createdPickupAuthorizationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty(
      '_id',
      createdPickupAuthorizationId,
    );
  });

  test('deve retornar 422 ao criar pickup authorization com período inválido', async () => {
    const now = new Date();
    const validFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const validUntil = new Date(now.getTime() + 60 * 60 * 1000);

    const payload = {
      school_id: schoolId,
      student_id: studentId,
      authorized_by: parentId,
      authorized_person: {
        name: 'Pedro Ferreira',
        document: `${Date.now() + 1}`,
        relationship: 'Tio',
        photo_url: null,
      },
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
    };

    const response = await request(BASE_URL)
      .post('/pickup-authorizations')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'O período informado é inválido.',
    );
  });

  test('deve retornar 422 ao criar pickup authorization com authorized_by sem role parent', async () => {
    const now = new Date();
    const validFrom = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const validUntil = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    const payload = {
      school_id: schoolId,
      student_id: studentId,
      authorized_by: studentId,
      authorized_person: {
        name: 'Joana Ferreira',
        document: `${Date.now() + 2}`,
        relationship: 'Mãe',
        photo_url: null,
      },
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
    };

    const response = await request(BASE_URL)
      .post('/pickup-authorizations')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'Apenas usuários com role parent podem ser informados em authorized_by.',
    );
  });

  test('deve atualizar pickup authorization por PATCH', async () => {
    const response = await request(BASE_URL)
      .patch(`/pickup-authorizations/${createdPickupAuthorizationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        used: true,
        active: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty(
      '_id',
      createdPickupAuthorizationId,
    );
    expect(response.body.data).toHaveProperty('used', true);
    expect(response.body.data).toHaveProperty('active', false);
  });

  test('deve deletar pickup authorization', async () => {
    const response = await request(BASE_URL)
      .delete(`/pickup-authorizations/${createdPickupAuthorizationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('deve retornar 404 ao buscar pickup authorization removida', async () => {
    const response = await request(BASE_URL)
      .get(`/pickup-authorizations/${createdPickupAuthorizationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });
});
