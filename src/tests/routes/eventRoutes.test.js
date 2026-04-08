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

async function tryGetClassTargetId(token) {
  const response = await request(BASE_URL)
    .get('/events')
    .query({ scope: 'class', limit: 1 })
    .set('Authorization', `Bearer ${token}`);

  if (response.status !== 200) return null;

  const firstEvent = response.body?.data?.docs?.[0];
  const targetId = firstEvent?.target?.target_id;

  if (!targetId) return null;
  if (typeof targetId === 'string') return targetId;
  if (typeof targetId === 'object' && targetId?._id) return targetId._id;

  return null;
}

describe('Event - integração de rotas', () => {
  let token;
  let schoolId;
  let classTargetId;
  let createdEventId;
  let createdClassScopedEventId;

  beforeAll(async () => {
    token = await loginAndGetToken();
    schoolId = await getFirstSchoolId(token);
    classTargetId = await tryGetClassTargetId(token);
  });

  afterAll(async () => {
    if (!createdClassScopedEventId) return;

    await request(BASE_URL)
      .delete(`/events/${createdClassScopedEventId}`)
      .set('Authorization', `Bearer ${token}`);
  });

  test('deve retornar 401 ao criar event sem token', async () => {
    const response = await request(BASE_URL)
      .post('/events')
      .send({
        school_id: schoolId,
        title: `Evento sem token ${Date.now()}`,
        type: 'event',
        start_date: '2026-04-10T09:00:00.000Z',
      });

    expect([401, 498]).toContain(response.status);
  });

  test('deve criar event com payload válido (POST /events)', async () => {
    const payload = {
      school_id: schoolId,
      title: `Evento integração ${Date.now()}`,
      description: 'Evento de teste para fluxo de criação.',
      type: 'event',
      start_date: '2026-04-10T09:00:00.000Z',
      end_date: '2026-04-10T11:00:00.000Z',
      all_day: false,
      target: {
        scope: 'all',
        target_id: null,
      },
      active: true,
    };

    const response = await request(BASE_URL)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data).toHaveProperty('school_id');
    expect(response.body.data).toHaveProperty('title', payload.title);
    expect(response.body.data).toHaveProperty('type', payload.type);
    expect(response.body.data).toHaveProperty('target');
    expect(response.body.data.target).toHaveProperty('scope', 'all');

    createdEventId = response.body.data._id;
  });

  test('deve listar events com token (GET /events)', async () => {
    const response = await request(BASE_URL)
      .get('/events')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
    expect(response.body.data).toHaveProperty('totalDocs');
    expect(response.body.data).toHaveProperty('page');
  });

  test('deve responder GET /events/:id com token', async () => {
    expect(createdEventId).toBeTruthy();

    const response = await request(BASE_URL)
      .get(`/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdEventId);
    expect(response.body.data).toHaveProperty('title');
    expect(response.body.data).toHaveProperty('school_id');
  });

  test('deve atualizar event por PATCH', async () => {
    expect(createdEventId).toBeTruthy();

    const payload = {
      title: `Evento atualizado ${Date.now()}`,
      description: 'Descrição atualizada',
      active: false,
    };

    const response = await request(BASE_URL)
      .patch(`/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', createdEventId);
    expect(response.body.data).toHaveProperty('title', payload.title);
    expect(response.body.data).toHaveProperty('active', payload.active);
  });

  test('deve permitir filtrar events por active=false', async () => {
    const response = await request(BASE_URL)
      .get('/events')
      .query({ active: 'false', limit: 100 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(Array.isArray(response.body.data.docs)).toBe(true);

    const found = response.body.data.docs.find(
      (doc) => doc._id === createdEventId,
    );
    expect(found).toBeTruthy();
    expect(found).toHaveProperty('active', false);
  });

  test('deve retornar 422 ao criar meeting sem horário explícito', async () => {
    const payload = {
      school_id: schoolId,
      title: `Meeting sem horario ${Date.now()}`,
      type: 'meeting',
      start_date: '2026-04-10',
      all_day: false,
      target: { scope: 'all' },
    };

    const response = await request(BASE_URL)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 422 ao criar meeting com all_day=true', async () => {
    const payload = {
      school_id: schoolId,
      title: `Meeting all_day ${Date.now()}`,
      type: 'meeting',
      start_date: '2026-04-10T14:30:00.000Z',
      all_day: true,
      target: { scope: 'all' },
    };

    const response = await request(BASE_URL)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 422 ao criar event com scope class sem target_id', async () => {
    const payload = {
      school_id: schoolId,
      title: `Evento class sem target ${Date.now()}`,
      type: 'event',
      start_date: '2026-04-12T09:00:00.000Z',
      target: {
        scope: 'class',
      },
      active: true,
    };

    const response = await request(BASE_URL)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'Para scope=class, informe o id da turma.',
    );
  });

  test('deve retornar 422 ao criar event com target_id de class inexistente', async () => {
    const payload = {
      school_id: schoolId,
      title: `Evento class inexistente ${Date.now()}`,
      type: 'event',
      start_date: '2026-04-13T09:00:00.000Z',
      target: {
        scope: 'class',
        target_id: '000000000000000000000000',
      },
      active: true,
    };

    const response = await request(BASE_URL)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty(
      'message',
      'target.target_id inválido.',
    );
  });

  test('deve criar event com scope class quando houver turma disponível', async () => {
    if (!classTargetId) {
      return;
    }

    const payload = {
      school_id: schoolId,
      title: `Evento class valido ${Date.now()}`,
      type: 'event',
      start_date: '2026-04-14T09:00:00.000Z',
      target: {
        scope: 'class',
        target_id: classTargetId,
      },
      active: true,
    };

    const response = await request(BASE_URL)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('target');
    expect(response.body.data.target).toHaveProperty('scope', 'class');

    const responseTargetId = asId(response.body.data?.target?.target_id);
    expect(responseTargetId).toBe(classTargetId);

    createdClassScopedEventId = response.body.data._id;
  });

  test('deve retornar 401 ao deletar event sem token', async () => {
    const response = await request(BASE_URL).delete(
      `/events/${createdEventId}`,
    );

    expect([401, 498]).toContain(response.status);
  });

  test('deve deletar event (DELETE /events/:id)', async () => {
    expect(createdEventId).toBeTruthy();

    const response = await request(BASE_URL)
      .delete(`/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
  });

  test('deve retornar 404 ao deletar event já removido', async () => {
    const response = await request(BASE_URL)
      .delete(`/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 404 ao buscar event removido', async () => {
    expect(createdEventId).toBeTruthy();

    const response = await request(BASE_URL)
      .get(`/events/${createdEventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });
});
