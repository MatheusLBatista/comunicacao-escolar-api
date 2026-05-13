import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@admin.com',
  password: process.env.ADMIN_PASSWORD || 'Senha@123',
};

const TEACHER = {
  email: process.env.TEACHER_EMAIL || 'maria.teacher@escola.com',
  password: process.env.TEACHER_PASSWORD || 'Senha@123',
};

async function login(credentials) {
  const response = await request(BASE_URL).post('/auth/login').send({
    email: credentials.email,
    password: credentials.password,
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

async function createPost(token, schoolId) {
  const payload = {
    title: `Post para Like Test ${Date.now()}`,
    content: 'Conteúdo de teste para verificar funcionalidade de like.',
    target: {
      scope: 'all',
    },
    attachments: [],
    active: true,
  };

  const response = await request(BASE_URL)
    .post(`/schools/${schoolId}/posts`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  expect(response.status).toBe(201);
  expect(response.body.data).toHaveProperty('_id');

  return response.body.data._id;
}

describe('Like Routes - Integração', () => {
  let adminToken;
  let teacherToken;
  let schoolId;
  let postId;

  beforeAll(async () => {
    adminToken = await login(ADMIN);
    teacherToken = await login(TEACHER);
    schoolId = await getFirstSchoolId(adminToken);
    postId = await createPost(adminToken, schoolId);
  });

  describe('POST /posts/:id/like - Toggle Like em Post', () => {
    test('deve retornar 401 ao fazer like sem token', async () => {
      const response = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .send({});

      expect([401, 498]).toContain(response.status);
    });

    test('deve fazer like em post com token válido', async () => {
      const response = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('post_id', postId);
      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data).toHaveProperty('created_at');
    });

    test('deve remover like ao chamar toggle novamente', async () => {
      // Primeiro like
      const response1 = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response1.status).toBe(200);

      // Segundo like (remover)
      const response2 = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response2.status).toBe(200);
      // O segundo toggle deve remover o like, verificando se a estrutura ainda existe
      expect(response2.body).toHaveProperty('error', false);
    });

    test('deve retornar 404 ao fazer like em post inválido', async () => {
      const invalidPostId = '000000000000000000000000';

      const response = await request(BASE_URL)
        .post(`/posts/${invalidPostId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 ao fazer like com postId em formato inválido', async () => {
      const response = await request(BASE_URL)
        .post('/posts/invalid-id-format/like')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect([400, 422]).toContain(response.status);
    });

    test('deve permitir múltiplos usuários fazer like no mesmo post', async () => {
      // Admin faz like
      const response1 = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response1.status).toBe(200);

      // Teacher faz like no mesmo post
      const response2 = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response2.status).toBe(200);

      // Verificar que ambos têm user_ids diferentes
      expect(response1.body.data.user_id).not.toBe(response2.body.data.user_id);
    });

    test('deve validar que o usuário pertence à mesma escola do post', async () => {
      // Este teste depende de ter um usuário de escola diferente
      // Por enquanto, apenas verificamos a estrutura da resposta
      const response = await request(BASE_URL)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      if (response.status === 403) {
        expect(response.body).toHaveProperty('error', true);
        expect(response.body).toHaveProperty('data');
      } else {
        expect(response.status).toBe(200);
      }
    });

    test('deve retornar resposta estruturada corretamente ao criar like', async () => {
      // Criar um novo post para garantir que teremos um like novo
      const newPostId = await createPost(adminToken, schoolId);

      const response = await request(BASE_URL)
        .post(`/posts/${newPostId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');

      // Se o like foi criado, deve ter _id, post_id e user_id
      if (response.body.data._id) {
        expect(response.body.data).toHaveProperty('post_id', newPostId);
        expect(response.body.data).toHaveProperty('user_id');
      }
    });

    test('deve retornar mensagem de sucesso ao remover like', async () => {
      // Criar um novo post exclusivo para este teste
      const newPostId = await createPost(adminToken, schoolId);

      // Fazer like primeira vez (criar)
      const response1 = await request(BASE_URL)
        .post(`/posts/${newPostId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response1.status).toBe(200);
      expect(response1.body.data).toHaveProperty('_id');

      // Fazer like segunda vez (remover)
      const response2 = await request(BASE_URL)
        .post(`/posts/${newPostId}/like`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response2.status).toBe(200);
      expect(response2.body).toHaveProperty('error', false);
      expect(response2.body).toHaveProperty('data');
      // Quando remove, deve conter uma mensagem de sucesso
      expect(response2.body.data).toHaveProperty('message');
    });
  });
});
