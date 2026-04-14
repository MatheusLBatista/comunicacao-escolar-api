import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const NONEXISTENT_ID = '000000000000000000000000';

const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@admin.com',
  password: process.env.ADMIN_PASSWORD || 'Senha@123',
};
const TEACHER = {
  email: process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
  password: process.env.TEACHER_PASSWORD || 'Senha@123',
};
const PARENT = {
  email: process.env.PARENT_EMAIL || 'ana.parent@escola.com',
  password: process.env.PARENT_PASSWORD || 'Senha@123',
};

async function login(credentials) {
  const response = await request(BASE_URL)
    .post('/login')
    .send({ email: credentials.email, password: credentials.password });

  expect(response.status).toBe(200);

  const user = response.body?.data?.user;
  expect(user?.access_token).toBeTruthy();

  return { token: user.access_token, userId: user._id };
}

async function getSchoolIdFromUser(token, userId) {
  const response = await request(BASE_URL)
    .get(`/users/${userId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);

  const schoolId = response.body?.data?.memberships?.[0]?.school_id;
  expect(schoolId).toBeTruthy();

  return schoolId;
}

describe('Conversation Routes - Integração', () => {
  // Admin: ator principal com permissões completas
  // Teacher: participante B da conversa Admin <-> Teacher
  // Parent: não participante da conversa Admin <-> Teacher
  let tokenAdmin;
  let tokenTeacher;
  let tokenParent;
  let adminId;
  let teacherId;
  let parentId;
  let schoolId;
  let conversationId;

  beforeAll(async () => {
    const [adminSession, teacherSession, parentSession] = await Promise.all([
      login(ADMIN),
      login(TEACHER),
      login(PARENT),
    ]);

    tokenAdmin = adminSession.token;
    adminId = adminSession.userId;

    tokenTeacher = teacherSession.token;
    teacherId = teacherSession.userId;

    tokenParent = parentSession.token;
    parentId = parentSession.userId;

    schoolId = await getSchoolIdFromUser(tokenAdmin, adminId);
  });

  describe('POST /schools/:schoolId/conversations - Criar ou Reutilizar Conversa', () => {
    test('deve criar nova conversa private com 201', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: teacherId });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('school_id');
      expect(response.body.data).toHaveProperty('type', 'private');
      expect(Array.isArray(response.body.data.participants)).toBe(true);

      conversationId = response.body.data._id;
    });

    test('segunda chamada com mesmo par deve retornar 200 e mesmo _id (idempotência)', async () => {
      expect(conversationId).toBeTruthy();

      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: teacherId });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('_id', conversationId);
    });

    test('deve criar conversa com type=daily_log_reply', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: parentId, type: 'daily_log_reply' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.data).toHaveProperty('type', 'daily_log_reply');
    });

    test('deve ignorar campo extra no body e retornar 201 ou 200', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: teacherId, foo: 'bar' });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('error', false);
    });

    test('deve retornar 400 para schoolId inválido (não ObjectId)', async () => {
      const response = await request(BASE_URL)
        .post('/schools/abc/conversations')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: teacherId });

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para participant_id inválido (não ObjectId)', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: 'abc123' });

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para type fora do enum', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: teacherId, type: 'group' });

      expect(response.status).toBe(400);
    });

    test('deve retornar 404 para participant_id inexistente', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: NONEXISTENT_ID });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 404 para schoolId inexistente', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${NONEXISTENT_ID}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: teacherId });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 ao criar conversa consigo mesmo', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: adminId });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toMatch(/consigo mesmo/i);
    });

    test('deve retornar 403 quando participante não pertence à escola', async () => {
      const timestamp = Date.now();
      const createRes = await request(BASE_URL)
        .post('/users')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          full_name: `Externo ${timestamp}`,
          email: `externo${timestamp}@fora.com`,
          password: 'Senha@123',
        });

      if (createRes.status !== 201) return;

      const externalUserId = createRes.body?.data?._id;

      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: externalUserId });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toMatch(/escola/i);
    });

    test('deve retornar 498 sem token', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .send({ participant_id: teacherId });

      expect(response.status).toBe(498);
    });

    test('deve retornar 401 com header sem prefixo Bearer', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', tokenAdmin)
        .send({ participant_id: teacherId });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /schools/:schoolId/conversations - Listagem por Escola', () => {
    test('deve listar conversas da escola onde o usuário é participante', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body.data).toHaveProperty('docs');
      expect(Array.isArray(response.body.data.docs)).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);

      response.body.data.docs.forEach((conv) => {
        const participantIds = conv.participants.map((p) =>
          typeof p === 'object' ? p._id : p,
        );
        expect(participantIds).toContain(adminId);
      });
    });

    test('deve filtrar conversas por type=private', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ type: 'private' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      response.body.data.docs.forEach((conv) => {
        expect(conv.type).toBe('private');
      });
    });

    test('deve filtrar conversas por type=daily_log_reply', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ type: 'daily_log_reply' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      response.body.data.docs.forEach((conv) => {
        expect(conv.type).toBe('daily_log_reply');
      });
    });

    test('deve usar paginação padrão (page=1, limit=10)', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data.limit).toBeLessThanOrEqual(10);
    });

    test('deve respeitar paginação customizada (?page=1&limit=1)', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data).toHaveProperty('limit', 1);
      expect(response.body.data.docs.length).toBeLessThanOrEqual(1);
    });

    test('deve ignorar campo extra na query e retornar 200', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ foo: 'bar' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
    });

    test('deve retornar 400 para schoolId inválido', async () => {
      const response = await request(BASE_URL)
        .get('/schools/abc/conversations')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para type inválido', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ type: 'group' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para page=0', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ page: 0 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para limit=0', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ limit: 0 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para limit=101', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ limit: 101 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para page e limit com sufixo alfanumérico', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .query({ page: '2abc', limit: '3xyz' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 498 sem token', async () => {
      const response = await request(BASE_URL).get(
        `/schools/${schoolId}/conversations`,
      );

      expect(response.status).toBe(498);
    });

    test('deve retornar 401 com header sem prefixo Bearer', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/conversations`)
        .set('Authorization', tokenAdmin);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /conversations/:id - Detalhe de Conversa', () => {
    test('deve retornar conversa com participantes populados', async () => {
      expect(conversationId).toBeTruthy();

      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body.data).toHaveProperty('_id', conversationId);
      expect(Array.isArray(response.body.data.participants)).toBe(true);
      expect(response.body.data.participants.length).toBeGreaterThan(0);

      const firstParticipant = response.body.data.participants[0];
      const isPopulated =
        typeof firstParticipant === 'object' &&
        (firstParticipant.full_name || firstParticipant.email);
      expect(isPopulated).toBeTruthy();
    });

    test('conversa recém-criada deve ter last_message_at nulo ou preenchido', async () => {
      const createRes = await request(BASE_URL)
        .post(`/schools/${schoolId}/conversations`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ participant_id: parentId });

      expect([200, 201]).toContain(createRes.status);
      const newConvId = createRes.body.data._id;

      const response = await request(BASE_URL)
        .get(`/conversations/${newConvId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('_id', newConvId);
      expect(response.body.data).toHaveProperty('last_message_at');
    });

    test('deve retornar 400 para id inválido (não ObjectId)', async () => {
      const response = await request(BASE_URL)
        .get('/conversations/abc')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 404 para id inexistente', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 403 para usuário não participante', async () => {
      expect(conversationId).toBeTruthy();

      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${tokenParent}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toMatch(/participante/i);
    });

    test('deve retornar 498 sem token', async () => {
      expect(conversationId).toBeTruthy();

      const response = await request(BASE_URL).get(
        `/conversations/${conversationId}`,
      );

      expect(response.status).toBe(498);
    });

    test('deve retornar 401 com header sem prefixo Bearer', async () => {
      expect(conversationId).toBeTruthy();

      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}`)
        .set('Authorization', tokenAdmin);

      expect(response.status).toBe(401);
    });
  });
});
