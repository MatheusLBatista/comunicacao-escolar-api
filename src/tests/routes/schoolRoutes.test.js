import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const createSchoolPayload = () => {
  const seed = Date.now().toString();
  const suffix = seed.slice(-8);

  return {
    name: `Escola Integração ${suffix}`,
    tax_id: `123456${seed.slice(-8)}`,
    address: {
      street: `Rua Teste ${suffix}`,
      number: '100',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01001000',
    },
    active: true,
  };
};

const loadFirstSchoolId = async (token) => {
  const response = await request(BASE_URL)
    .get('/schools')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  const docs = response.body?.data?.docs || [];
  return docs[0]?._id;
};

describe('School - integração de endpoints', () => {
  let token;
  let schoolId;

  beforeAll(async () => {
    const loginResponse = await request(BASE_URL).post('/login').send({
      email: 'admin@admin.com',
      password: 'Senha@123',
    });

    expect(loginResponse.status).toBe(200);
    token = loginResponse.body?.data?.user?.access_token;
    expect(token).toBeTruthy();

    schoolId = await loadFirstSchoolId(token);
  });

  test('deve retornar 401 ao listar schools sem token', async () => {
    const response = await request(BASE_URL).get('/schools');

    expect([401, 498]).toContain(response.status);
  });

  test('deve listar schools com token', async () => {
    const response = await request(BASE_URL)
      .get('/schools')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
  });

  test('deve criar school com payload válido', async () => {
    const payload = createSchoolPayload();

    const response = await request(BASE_URL)
      .post('/schools')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect([201, 409]).toContain(response.status);

    if (response.status === 201) {
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name', payload.name);
      expect(response.body.data).toHaveProperty('tax_id', payload.tax_id);
      schoolId = response.body.data._id;
      return;
    }

    expect(response.body).toHaveProperty('error', true);
    schoolId = await loadFirstSchoolId(token);
    expect(schoolId).toBeTruthy();
  });

  test('deve retornar 400 ao criar school com payload inválido', async () => {
    const invalidPayload = {
      name: '',
      tax_id: '123',
      address: {
        street: '',
        number: '',
        city: '',
        state: '',
        zip_code: '1',
      },
    };

    const response = await request(BASE_URL)
      .post('/schools')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve buscar school por id', async () => {
    expect(schoolId).toBeTruthy();

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('_id', schoolId);
  });

  test('deve atualizar school por PATCH', async () => {
    const payload = {
      name: `Escola Atualizada ${Date.now().toString().slice(-5)}`,
      active: false,
    };

    const response = await request(BASE_URL)
      .patch(`/schools/${schoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('_id', schoolId);
    expect(response.body.data).toHaveProperty('name', payload.name);
    expect(response.body.data).toHaveProperty('active', payload.active);
  });

  test('deve retornar 404 ao buscar school inexistente', async () => {
    const response = await request(BASE_URL)
      .get('/schools/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve deletar school', async () => {
    const response = await request(BASE_URL)
      .delete(`/schools/${schoolId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('error', false);
  });

  test('deve retornar 404 ao deletar school já removida', async () => {
    const response = await request(BASE_URL)
      .delete(`/schools/${schoolId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });
});
