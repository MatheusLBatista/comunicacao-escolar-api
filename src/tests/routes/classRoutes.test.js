import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const NONEXISTENT_ID = '000000000000000000000000';

const asId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id;
  return null;
};

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

describe('Class Routes - Integracao', () => {
  let adminToken;
  let schoolId;
  let teacherUser;
  let createdClass;

  beforeAll(async () => {
    adminToken = await loginAndGetToken();
    schoolId = await getFirstSchoolId(adminToken);

    teacherUser = await createSchoolUser({
      token: adminToken,
      schoolId,
      role: 'teacher',
      seedLabel: 'TeacherClass',
    });
  });

  test('deve retornar 401/498 ao criar turma sem token', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/class`)
      .send({
        name: `Turma Sem Token ${Date.now()}`,
        grade: '1A',
        year: 2026,
        teacher_ids: [teacherUser.id],
      });

    expect([401, 498]).toContain(response.status);
  });

  test('deve retornar 400 ao criar turma com payload invalido', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/class`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '',
        grade: '',
        year: 'ano',
        teacher_ids: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  //400
  test('deve retornar 403 ao criar turma com schoolId invalido', async () => {
    const response = await request(BASE_URL)
      .post('/schools/invalidSchoolId/class')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Turma ID invalido ${Date.now()}`,
        grade: '2B',
        year: 2026,
        teacher_ids: [teacherUser.id],
      });

    expect(response.status).toBe(403);
    console.log(response.body)
  });

  //404
  test('deve retornar 403 ao criar turma com schoolId inexistente', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${NONEXISTENT_ID}/class`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Turma Escola Inexistente ${Date.now()}`,
        grade: '3C',
        year: 2026,
        teacher_ids: [teacherUser.id],
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 422 ao criar turma com teacher_ids invalidos', async () => {
    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/class`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Turma Professor Invalido ${Date.now()}`,
        grade: '4D',
        year: 2026,
        teacher_ids: [teacherUser.id, '507f1f77bcf86cd799439011'],
      });

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve criar turma com payload valido', async () => {
    const payload = {
      name: `Turma Integracao ${Date.now()}`,
      grade: '5E',
      year: 2026,
      teacher_ids: [teacherUser.id],
      active: true,
    };

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/class`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');

    const data = response.body.data;
    const createdId = asId(data);

    expect(createdId).toBeTruthy();

    if (data?.name) {
      expect(data.name).toBe(payload.name);
    }

    if (data?.grade) {
      expect(data.grade).toBe(payload.grade);
    }

    if (data?.year) {
      expect(data.year).toBe(payload.year);
    }

    if (data?.school_id) {
      expect(asId(data.school_id)).toBe(schoolId);
    }

    createdClass = {
      id: createdId,
      name: payload.name,
      grade: payload.grade,
    };
  });

  test('deve retornar 409 ao criar turma duplicada na mesma escola', async () => {
    if (!createdClass) {
      expect(createdClass).toBeTruthy();
      return;
    }

    const response = await request(BASE_URL)
      .post(`/schools/${schoolId}/class`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: createdClass.name,
        grade: createdClass.grade,
        year: 2026,
        teacher_ids: [teacherUser.id],
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', true);
  });
});
