import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
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


async function findOrCreateConversation(token, schoolId, participantId) {
  const response = await request(BASE_URL)
    .post(`/schools/${schoolId}/conversations`)
    .set('Authorization', `Bearer ${token}`)
    .send({ participant_id: participantId });

  expect([200, 201]).toContain(response.status);

  const conversationId = response.body?.data?._id;
  expect(conversationId).toBeTruthy();

  return conversationId;
}

describe('Message Routes - Integração', () => {
  // tokenAdmin: ator A (permissões completas)
  // tokenTeacher: ator B (participante da conversa)
  // tokenParent: ator C (não participante, usará outra conversa)
  let tokenAdmin;
  let tokenTeacher;
  let tokenParent;
  let schoolId;
  let conversationId;

  beforeAll(async () => {
    const [adminSession, teacherSession, parentSession] = await Promise.all([
      login(ADMIN),
      login(TEACHER),
      login(PARENT),
    ]);

    tokenAdmin = adminSession.token;
    tokenTeacher = teacherSession.token;
    tokenParent = parentSession.token;

    const teacherId = teacherSession.userId;

    schoolId = await getSchoolIdFromUser(tokenAdmin, adminSession.userId);

    conversationId = await findOrCreateConversation(
      tokenAdmin,
      schoolId,
      teacherId,
    );
  });

  describe('POST /conversations/:conversationId/messages - Envio de Mensagem', () => {
    test('deve enviar mensagem válida e retornar 201', async () => {
      const text = `Mensagem de teste ${Date.now()}`;

      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('text', text);
      expect(response.body.data).toHaveProperty('sender_id');
    });

    test('read_by inicial deve conter o remetente com user_id e at', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: `Leitura inicial ${Date.now()}` });

      expect(response.status).toBe(201);

      const readBy = response.body?.data?.read_by;
      expect(Array.isArray(readBy)).toBe(true);
      expect(readBy.length).toBeGreaterThan(0);
      expect(readBy[0]).toHaveProperty('user_id');
      expect(readBy[0]).toHaveProperty('at');
    });

    test('deve atualizar last_message_at da conversa após envio', async () => {
      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: `Atualiza timestamp ${Date.now()}` });

      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body?.data?.last_message_at).not.toBeNull();
    });

    test('deve ignorar campo extra no body e retornar 201', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: `Campo extra ${Date.now()}`, foo: 'bar' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('error', false);
    });

    test('deve retornar 400 para conversationId inválido (não ObjectId)', async () => {
      const response = await request(BASE_URL)
        .post('/conversations/abc/messages')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: 'Texto qualquer' });

      expect(response.status).toBe(400);
    });

    test('deve retornar 404 para conversationId inexistente', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${NONEXISTENT_ID}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: 'Texto qualquer' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para text vazio', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para body sem text', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 403 para usuário não participante da conversa', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenParent}`)
        .send({ text: 'Invasão' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toMatch(/participante/i);
    });

    test('deve retornar 498 sem token', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .send({ text: 'Sem token' });

      expect(response.status).toBe(498);
    });

    test('deve retornar 401 com header sem prefixo Bearer', async () => {
      const response = await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', tokenAdmin)
        .send({ text: 'Sem bearer' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /conversations/:conversationId/messages - Listagem de Mensagens', () => {
    beforeAll(async () => {
      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: `Msg Admin 1 ${Date.now()}` });

      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenTeacher}`)
        .send({ text: `Msg Teacher 1 ${Date.now()}` });

      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: `Msg Admin 2 ${Date.now()}` });
    });

    test('deve listar mensagens da conversa e retornar 200', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body.data).toHaveProperty('docs');
      expect(Array.isArray(response.body.data.docs)).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);

      response.body.data.docs.forEach((msg) => {
        expect(msg).toHaveProperty('conversation_id', conversationId);
      });
    });

    test('deve retornar mensagens ordenadas por sent_at decrescente', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);

      const docs = response.body.data.docs;
      for (let i = 0; i < docs.length - 1; i++) {
        const current = new Date(docs[i].sent_at).getTime();
        const next = new Date(docs[i + 1].sent_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    test('deve usar paginação padrão (page=1, limit=10)', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data.limit).toBeLessThanOrEqual(10);
    });

    test('deve respeitar paginação customizada (?page=1&limit=2)', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data).toHaveProperty('limit', 2);
      expect(response.body.data.docs.length).toBeLessThanOrEqual(2);
    });

    test('deve ignorar campo extra na query e retornar 200', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .query({ foo: 'bar' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
    });

    test('deve retornar 400 para conversationId inválido (não ObjectId)', async () => {
      const response = await request(BASE_URL)
        .get('/conversations/abc/messages')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 404 para conversationId inexistente', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${NONEXISTENT_ID}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para page=0', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .query({ page: 0 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para limit=0', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .query({ limit: 0 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para limit=101', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .query({ limit: 101 })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 para page e limit com sufixo alfanumérico', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .query({ page: '2abc', limit: '3xyz' })
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 403 para usuário não participante', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenParent}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 498 sem token', async () => {
      const response = await request(BASE_URL).get(
        `/conversations/${conversationId}/messages`,
      );

      expect(response.status).toBe(498);
    });

    test('deve retornar 401 com header sem prefixo Bearer', async () => {
      const response = await request(BASE_URL)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', tokenAdmin);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /conversations/:conversationId/messages/read - Marcar como Lidas', () => {
    beforeAll(async () => {
      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenTeacher}`)
        .send({ text: `Msg Teacher para ler ${Date.now()}` });

      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenTeacher}`)
        .send({ text: `Msg Teacher para ler 2 ${Date.now()}` });
    });

    test('deve marcar mensagens não lidas de terceiros e retornar marked > 0', async () => {
      const response = await request(BASE_URL)
        .patch(`/conversations/${conversationId}/messages/read`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty(
        'message',
        'Mensagens marcadas como lidas.',
      );
      expect(response.body.data).toHaveProperty('marked');
      expect(response.body.data.marked).toBeGreaterThan(0);
    });

    test('segunda chamada deve retornar marked=0 (idempotência)', async () => {
      await request(BASE_URL)
        .patch(`/conversations/${conversationId}/messages/read`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      const response = await request(BASE_URL)
        .patch(`/conversations/${conversationId}/messages/read`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('marked', 0);
    });

    test('mensagens próprias não devem entrar no contador de marked', async () => {
      await request(BASE_URL)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ text: `Própria do Admin ${Date.now()}` });

      const response = await request(BASE_URL)
        .patch(`/conversations/${conversationId}/messages/read`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('marked', 0);
    });

    test('deve retornar 400 para conversationId inválido', async () => {
      const response = await request(BASE_URL)
        .patch('/conversations/abc/messages/read')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(400);
    });

    test('deve retornar 404 para conversationId inexistente', async () => {
      const response = await request(BASE_URL)
        .patch(`/conversations/${NONEXISTENT_ID}/messages/read`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 403 para usuário não participante', async () => {
      const response = await request(BASE_URL)
        .patch(`/conversations/${conversationId}/messages/read`)
        .set('Authorization', `Bearer ${tokenParent}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 498 sem token', async () => {
      const response = await request(BASE_URL).patch(
        `/conversations/${conversationId}/messages/read`,
      );

      expect(response.status).toBe(498);
    });

    test('deve retornar 401 com header sem prefixo Bearer', async () => {
      const response = await request(BASE_URL)
        .patch(`/conversations/${conversationId}/messages/read`)
        .set('Authorization', tokenAdmin);

      expect(response.status).toBe(401);
    });
  });
});
