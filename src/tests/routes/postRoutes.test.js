import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3010;
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

describe('Post Routes - Integração', () => {
  let token;
  let schoolId;
  let createdPostId;

  beforeAll(async () => {
    token = await loginAndGetToken();
    schoolId = await getFirstSchoolId(token);
  });

  describe('POST /schools/:schoolId/post - Criar comunicado', () => {
    test('deve retornar 401 ao criar post sem token', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/post`)
        .send({
          title: `Post sem token ${Date.now()}`,
          content: 'Conteúdo de teste sem autenticação.',
        });

      expect([401, 498]).toContain(response.status);
    });

    test('deve criar post com payload válido', async () => {
      const payload = {
        title: `Post integração ${Date.now()}`,
        content: 'Conteúdo de teste para criação de comunicado.',
        target: {
          scope: 'all',
        },
        attachments: [],
        active: true,
      };

      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/post`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('school_id', schoolId);
      expect(response.body.data).toHaveProperty('title', payload.title);
      expect(response.body.data).toHaveProperty('content', payload.content);
      expect(response.body.data).toHaveProperty('author_id');

      createdPostId = response.body.data._id;
    });

    test('deve retornar 422 ao criar post com campos obrigatórios ausentes', async () => {
      const payload = {
        title: 'Título sem conteúdo',
        // content ausente - obrigatório
      };

      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/post`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 404 ao criar post com schoolId inválido', async () => {
      const payload = {
        title: 'Teste',
        content: 'Teste',
      };

      const response = await request(BASE_URL)
        .post('/schools/invalid-school-id/post')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect([400, 404, 422]).toContain(response.status);
    });

    test('deve criar post com target.scope=class quando target_id for válido', async () => {
      // Assumindo que existe uma turma vinculada à escola
      const payload = {
        title: `Post para turma ${Date.now()}`,
        content: 'Conteúdo para turma específica.',
        target: {
          scope: 'class',
          target_id: '507f1f77bcf86cd799439023', // Usar um ID válido de teste
        },
        active: true,
      };

      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/post`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      // Pode ser 201 (sucesso) ou 422 (turma não existe)
      expect([201, 422]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.data).toHaveProperty('target');
        expect(response.body.data.target).toHaveProperty('scope', 'class');
      }
    });
  });

  describe('GET /post - Listar comunicados', () => {
    test('deve retornar 401 ao listar posts sem token', async () => {
      const response = await request(BASE_URL).get('/post');

      expect([401, 498]).toContain(response.status);
    });

    test('deve listar posts com token', async () => {
      const response = await request(BASE_URL)
        .get('/post')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('docs');
      expect(Array.isArray(response.body.data.docs)).toBe(true);
      expect(response.body.data).toHaveProperty('totalDocs');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    test('deve listar posts com paginação', async () => {
      const response = await request(BASE_URL)
        .get('/post?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data.limit).toBe(5);
    });

    test('deve listar posts com filtro por author_id', async () => {
      const response = await request(BASE_URL)
        .get(`/post?author_id=${Date.now()}`) // ID que provavelmente não existe
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalDocs).toBe(0);
    });

    test('deve listar posts com filtro por title', async () => {
      const response = await request(BASE_URL)
        .get('/post?title=Post%20integração')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('docs');
    });

    test('deve listar posts com filtro por active', async () => {
      const response = await request(BASE_URL)
        .get('/post?active=true')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('docs');
    });
  });

  describe('GET /post/:id - Buscar comunicado por ID', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL).get(`/post/${createdPostId || '507f1f77bcf86cd799439013'}`);

      expect([401, 498]).toContain(response.status);
    });

    test('deve buscar post específico por ID', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      const response = await request(BASE_URL)
        .get(`/post/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', createdPostId);
    });

    test('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(BASE_URL)
        .get(`/post/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para ID em formato inválido', async () => {
      const response = await request(BASE_URL)
        .get('/post/invalid-id-format')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('PATCH /post/:id - Atualizar comunicado', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL)
        .patch(`/post/${createdPostId || '507f1f77bcf86cd799439013'}`)
        .send({ title: 'Novo título' });

      expect([401, 498]).toContain(response.status);
    });

    test('deve atualizar post com payload válido', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      const updatePayload = {
        title: `Post atualizado ${Date.now()}`,
        content: 'Conteúdo atualizado',
      };

      const response = await request(BASE_URL)
        .patch(`/post/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', updatePayload.title);
      expect(response.body.data).toHaveProperty('content', updatePayload.content);
    });

    test('deve atualizar apenas alguns campos', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      const updatePayload = {
        title: `Atualizado parcial ${Date.now()}`,
      };

      const response = await request(BASE_URL)
        .patch(`/post/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('title', updatePayload.title);
    });

    test('deve retornar 404 ao atualizar post inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const updatePayload = { title: 'Novo título' };

      const response = await request(BASE_URL)
        .patch(`/post/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para ID em formato inválido', async () => {
      const response = await request(BASE_URL)
        .patch('/post/invalid-id-format')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Novo título' });

      expect([400, 422]).toContain(response.status);
    });

    test('deve atualizar target com scope e target_id válidos', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      const updatePayload = {
        target: {
          scope: 'class',
          target_id: '507f1f77bcf86cd799439023',
        },
      };

      const response = await request(BASE_URL)
        .patch(`/post/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      // Pode ser 200 (sucesso) ou 422 (turma não existe)
      expect([200, 422, 403]).toContain(response.status);
    });

    test('deve atualizar status active', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      const updatePayload = {
        active: false,
      };

      const response = await request(BASE_URL)
        .patch(`/post/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect([200, 403]).toContain(response.status); // 403 se não for autorizado

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('active', false);
      }
    });
  });

  describe('GET /schools/:schoolId/post - Listar comunicados da escola', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL).get(`/schools/${schoolId}/post`);

      expect([401, 498]).toContain(response.status);
    });

    test('deve listar posts da escola específica', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/post`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('docs');
      expect(Array.isArray(response.body.data.docs)).toBe(true);
    });

    test('deve listar posts da escola com filtros', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/post?page=1&limit=5`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('limit', 5);
    });

    test('deve retornar 400 para schoolId inválido', async () => {
      const response = await request(BASE_URL)
        .get('/schools/invalid-school-id/post')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 422]).toContain(response.status);
    });
  });
});
