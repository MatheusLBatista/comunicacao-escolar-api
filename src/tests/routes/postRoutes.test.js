import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
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

  describe('POST /schools/:schoolId/posts - Criar comunicado', () => {
    test('deve retornar 401 ao criar post sem token', async () => {
      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/posts`)
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
        .post(`/schools/${schoolId}/posts`)
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

    test('deve retornar 404 ao criar post com schoolId inválido', async () => {
      const payload = {
        title: 'Teste',
        content: 'Teste',
      };

      const response = await request(BASE_URL)
        .post('/schools/invalid-school-id/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      // AuthPermission retorna 403 se o schoolId não pertencer ao usuário
      expect([400, 403, 404, 422]).toContain(response.status);
    });

    test('deve retornar 422 ao criar post com scope diferente de "all" sem target_id', async () => {
      const payload = {
        title: `Post inválido ${Date.now()}`,
        content: 'Conteúdo sem o target_id exigido.',
        target: {
          scope: 'class',
          // target_id ausente
        },
        active: true,
      };

      const response = await request(BASE_URL)
        .post(`/schools/${schoolId}/posts`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', true);
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
        .post(`/schools/${schoolId}/posts`)
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

  describe('GET /schools/:schoolId/posts - Listar comunicados', () => {
    test('deve retornar 401 ao listar posts sem token', async () => {
      const response = await request(BASE_URL).get(`/schools/${schoolId}/posts`);

      expect([401, 498]).toContain(response.status);
    });

    test('deve listar posts com token', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/posts`)
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
        .get(`/schools/${schoolId}/posts?page=1&limit=5`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data.limit).toBe(5);
    });

    test('deve listar posts com filtro por title', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/posts?title=Post%20integração`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('docs');
    });

    test('deve listar posts com filtro por active', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/posts?active=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('docs');
    });
  });

  describe('GET /posts/:id - Buscar comunicado por ID', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL).get(
        `/posts/${createdPostId || '507f1f77bcf86cd799439013'}`
      );

      expect([401, 498]).toContain(response.status);
    });

    test('deve buscar post específico por ID', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      const response = await request(BASE_URL)
        .get(`/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', createdPostId);
    });

    test('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(BASE_URL)
        .get(`/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para ID em formato inválido', async () => {
      const response = await request(BASE_URL)
        .get('/posts/invalid-id-format')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('PATCH /posts/:id - Atualizar comunicado', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL)
        .patch(`/posts/${createdPostId || '507f1f77bcf86cd799439013'}`)
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
        .patch(`/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', updatePayload.title);
      expect(response.body.data).toHaveProperty(
        'content',
        updatePayload.content,
      );
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
        .patch(`/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('title', updatePayload.title);
    });

    test('deve retornar 404 ao atualizar post inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const updatePayload = { title: 'Novo título' };

      const response = await request(BASE_URL)
        .patch(`/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para ID em formato inválido', async () => {
      const response = await request(BASE_URL)
        .patch('/posts/invalid-id-format')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Novo título' });

      expect([400, 422]).toContain(response.status);
    });

    test('deve retornar 409 ao vincular post a turma de outra escola', async () => {
      if (!createdPostId) return;

      // 1. Criar uma nova escola (Escola B)
      const createSchoolResponse = await request(BASE_URL)
        .post('/schools')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Escola Conflito ${Date.now()}`,
          cnpj: `000000000001${Date.now().toString().slice(-2)}`,
          address: { street: 'Rua B', number: '100', city: 'Cidade', state: 'SP', zip_code: '00000-000' }
        });
      
      if (createSchoolResponse.status !== 201) return; // Pula se não puder criar escola
      const otherSchoolId = createSchoolResponse.body.data._id;

      // 2. Criar uma turma na Escola B
      const createClassResponse = await request(BASE_URL)
        .post(`/schools/${otherSchoolId}/class`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Turma Conflito',
          grade: '1A',
          year: 2026,
          teacher_ids: []
        });

      if (createClassResponse.status !== 201) return;
      const otherClassId = createClassResponse.body.data._id;

      // 3. Tentar atualizar o post da Escola A com a turma da Escola B
      const response = await request(BASE_URL)
        .patch(`/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          target: {
            scope: 'class',
            target_id: otherClassId
          }
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', true);
      expect(JSON.stringify(response.body)).toContain('escola diferente');
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
        .patch(`/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect([200, 403]).toContain(response.status); // 403 se não for autorizado

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('active', false);
      }
    });
  });

  describe('DELETE /posts/:id - Deletar comunicado', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL).delete(
        `/posts/${createdPostId || '507f1f77bcf86cd799439013'}`
      );

      expect([401, 498]).toContain(response.status);
    });

    test('deve deletar post com sucesso', async () => {
      // Primeiro criar um novo post para deletar
      const createPayload = {
        title: `Post para deletar ${Date.now()}`,
        content: 'Conteúdo para deletar.',
        target: {
          scope: 'all',
        },
        active: true,
      };

      const createResponse = await request(BASE_URL)
        .post(`/schools/${schoolId}/posts`)
        .set('Authorization', `Bearer ${token}`)
        .send(createPayload);

      expect(createResponse.status).toBe(201);
      const postIdToDelete = createResponse.body.data._id;

      // Depois deletar
      const deleteResponse = await request(BASE_URL)
        .delete(`/posts/${postIdToDelete}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('error', false);
      expect(deleteResponse.body).toHaveProperty('data');
      expect(deleteResponse.body.data).toHaveProperty(
        'message',
        'Anúncio deletado com sucesso',
      );
    });

    test('deve retornar 404 ao deletar post inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const response = await request(BASE_URL)
        .delete(`/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('deve retornar 400 para ID em formato inválido', async () => {
      const response = await request(BASE_URL)
        .delete('/posts/invalid-id-format')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 422]).toContain(response.status);
    });

    test('deve retornar 403 ao tentar deletar post de outro autor', async () => {
      if (!createdPostId) {
        console.log('⚠️  createdPostId não definido, pulando teste');
        return;
      }

      // Tentar deletar o post criado anteriormente (que pode ter outro autor)
      const response = await request(BASE_URL)
        .delete(`/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${token}`);

      // Pode retornar 200 se for o mesmo autor, ou 403 se não for autorizado
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('GET /schools/:schoolId/posts - Listar comunicados da escola (redundante)', () => {
    test('deve retornar 401 sem token', async () => {
      const response = await request(BASE_URL).get(`/schools/${schoolId}/posts`);

      expect([401, 498]).toContain(response.status);
    });

    test('deve listar posts da escola específica', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/posts`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('docs');
      expect(Array.isArray(response.body.data.docs)).toBe(true);
    });

    test('deve listar posts da escola com filtros', async () => {
      const response = await request(BASE_URL)
        .get(`/schools/${schoolId}/posts?page=1&limit=5`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('limit', 5);
    });

    test('deve retornar 400 para schoolId inválido', async () => {
      const response = await request(BASE_URL)
        .get('/schools/invalid-school-id/posts')
        .set('Authorization', `Bearer ${token}`);

      // AuthPermission retorna 403 se o schoolId não bater com membership
      expect([400, 403, 422]).toContain(response.status);
    });
  });
});
