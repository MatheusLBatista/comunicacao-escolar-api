import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

const expectSuccessEnvelope = (response) => {
  expect(response.body).toHaveProperty('error', false);
  expect(response.body).toHaveProperty('data');
};

async function loginAs(email, password) {
  const response = await request(BASE_URL)
    .post('/auth/login')
    .send({ email, password });

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

describe('AuditLog - integração de rotas', () => {
  let token;
  let teacherToken;
  let schoolId;
  let firstLogId;
  let firstLogUserId;
  let firstLogResourceType;
  let firstLogResourceId;
  let firstLogStudentId;

  beforeAll(async () => {
    token = await loginAs(
      process.env.ADMIN_EMAIL || 'admin@admin.com',
      process.env.ADMIN_PASSWORD || 'Senha@123',
    );
    schoolId = await getFirstSchoolId(token);
    teacherToken = await loginAs(
      process.env.TEACHER_EMAIL || 'teacher@teacher.com',
      process.env.TEACHER_PASSWORD || 'Senha@123',
    );

    // Busca um audit log existente para usar nos testes de detalhe e filtro
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs`)
      .query({ limit: 10 })
      .set('Authorization', `Bearer ${token}`);

    if (response.status === 200 && response.body?.data?.docs?.length > 0) {
      const firstLog = response.body.data.docs[0];
      firstLogId = firstLog._id;

      // Extrai user_id (pode ser objeto populado ou string)
      firstLogUserId =
        typeof firstLog.user_id === 'object'
          ? firstLog.user_id._id
          : firstLog.user_id;

      firstLogResourceType = firstLog.resource_type;
      firstLogResourceId = firstLog.resource_id;

      // Busca um log com student_id preenchido
      const logWithStudent = response.body.data.docs.find(
        (doc) => doc.student_id != null,
      );

      if (logWithStudent) {
        firstLogStudentId =
          typeof logWithStudent.student_id === 'object'
            ? logWithStudent.student_id._id
            : logWithStudent.student_id;
      }
    }
  });

  // ─── GET /schools/:id/audit-logs — Listagem ───

  test('deve retornar 401 ao listar audit logs sem token', async () => {
    const response = await request(BASE_URL).get(
      `/schools/${schoolId}/audit-logs`,
    );

    expect([401, 498]).toContain(response.status);
  });

  test('deve retornar 403 ao listar audit logs com token de teacher', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve listar audit logs com token admin (GET /schools/:id/audit-logs)', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
    expect(response.body.data).toHaveProperty('totalDocs');
    expect(response.body.data).toHaveProperty('page');
  });

  test('deve filtrar audit logs por resource_type', async () => {
    if (!firstLogResourceType) return;

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs`)
      .query({ resource_type: firstLogResourceType })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(Array.isArray(response.body.data.docs)).toBe(true);

    response.body.data.docs.forEach((doc) => {
      expect(doc.resource_type).toBe(firstLogResourceType);
    });
  });

  test('deve filtrar audit logs por action', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs`)
      .query({ action: 'view' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(Array.isArray(response.body.data.docs)).toBe(true);

    response.body.data.docs.forEach((doc) => {
      expect(doc.action).toBe('view');
    });
  });

  test('deve respeitar paginação com limit e page', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs`)
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data.docs.length).toBeLessThanOrEqual(2);
    expect(response.body.data).toHaveProperty('totalPages');
    expect(response.body.data).toHaveProperty('hasPrevPage');
    expect(response.body.data).toHaveProperty('hasNextPage');
  });

  // ─── GET /schools/:id/audit-logs/:logId — Detalhe ───

  test('deve buscar audit log por id (GET /schools/:id/audit-logs/:logId)', async () => {
    if (!firstLogId) return;

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/${firstLogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('_id', firstLogId);
    expect(response.body.data).toHaveProperty('school_id');
    expect(response.body.data).toHaveProperty('user_id');
    expect(response.body.data).toHaveProperty('action');
    expect(response.body.data).toHaveProperty('resource_type');
    expect(response.body.data).toHaveProperty('resource_id');
  });

  test('deve retornar 404 ao buscar audit log inexistente', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/000000000000000000000000`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });

  // ─── GET /schools/:id/audit-logs/summary — Resumo Agregado ───

  test('deve retornar resumo agregado por resource_type (GET /schools/:id/audit-logs/summary)', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/summary`)
      .query({ group_by: 'resource_type' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('total_accesses');
    expect(response.body.data).toHaveProperty('unique_users');
    expect(response.body.data).toHaveProperty('groups');
    expect(Array.isArray(response.body.data.groups)).toBe(true);
    expect(response.body.data).toHaveProperty('period');

    response.body.data.groups.forEach((group) => {
      expect(group).toHaveProperty('key');
      expect(group).toHaveProperty('count');
      expect(group).toHaveProperty('unique_users');
    });
  });

  test('deve retornar resumo agregado por day', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/summary`)
      .query({ group_by: 'day' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('groups');
    expect(Array.isArray(response.body.data.groups)).toBe(true);
  });

  test('deve retornar resumo com filtro de período', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/summary`)
      .query({
        group_by: 'resource_type',
        start_date: '2020-01-01',
        end_date: '2030-12-31',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('period');
    expect(response.body.data.period).toHaveProperty('start', '2020-01-01');
    expect(response.body.data.period).toHaveProperty('end', '2030-12-31');
  });

  // ─── GET /schools/:id/audit-logs/resource/:resourceType/:resourceId — Por Recurso ───

  test('deve listar audit logs por recurso específico', async () => {
    if (!firstLogResourceType || !firstLogResourceId) return;

    const response = await request(BASE_URL)
      .get(
        `/schools/${schoolId}/audit-logs/resource/${firstLogResourceType}/${firstLogResourceId}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
  });

  // ─── GET /schools/:id/audit-logs/user/:userId — Por Usuário ───

  test('deve listar audit logs por usuário específico', async () => {
    if (!firstLogUserId) return;

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/user/${firstLogUserId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
  });

  // ─── GET /schools/:id/audit-logs/student/:studentId — Por Aluno ───

  test('deve listar audit logs por aluno específico', async () => {
    if (!firstLogStudentId) return;

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/student/${firstLogStudentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response);
    expect(response.body.data).toHaveProperty('docs');
    expect(Array.isArray(response.body.data.docs)).toBe(true);
  });

  // ─── Cenários extras de permissão ───

  test('deve retornar 403 ao buscar detalhe de audit log com token de teacher', async () => {
    if (!firstLogId) return;

    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/${firstLogId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', true);
  });

  test('deve retornar 403 ao acessar summary com token de teacher', async () => {
    const response = await request(BASE_URL)
      .get(`/schools/${schoolId}/audit-logs/summary`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', true);
  });
});
