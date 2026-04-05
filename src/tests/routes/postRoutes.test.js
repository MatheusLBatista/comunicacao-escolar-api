import request from 'supertest';
import { beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.INTEGRATION_BASE_URL || `http://localhost:${PORT}`;

async function loginAndGetToken() {
	const response = await request(BASE_URL).post('/login').send({
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

describe('Post - integração de rotas', () => {
	let token;
	let schoolId;
	let createdPostId;

	beforeAll(async () => {
		token = await loginAndGetToken();
		schoolId = await getFirstSchoolId(token);
	});

	test('deve retornar 401 ao criar post sem token', async () => {
		const response = await request(BASE_URL).post('/post').send({
			school_id: schoolId,
			title: `Post sem token ${Date.now()}`,
			content: 'Conteúdo de teste sem autenticação.',
			target: {
				scope: 'all',
			},
			attachments: [],
		});

		expect([401, 498]).toContain(response.status);
	});

	test('deve criar post com payload válido (POST /post)', async () => {
		const payload = {
			school_id: schoolId,
			title: `Post integração ${Date.now()}`,
			content: 'Conteúdo de teste para criação de anúncio.',
			target: {
				scope: 'all',
			},
			attachments: [],
			active: true,
		};

		const response = await request(BASE_URL)
			.post('/post')
			.set('Authorization', `Bearer ${token}`)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty('error', false);
		expect(response.body).toHaveProperty('data');
		expect(response.body.data).toHaveProperty('_id');
		expect(response.body.data).toHaveProperty('school_id', schoolId);
		expect(response.body.data).toHaveProperty('title', payload.title);

		createdPostId = response.body.data._id;
	});

	test('deve listar posts com token (GET /post)', async () => {
		const response = await request(BASE_URL)
			.get('/post')
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('error', false);
		expect(response.body).toHaveProperty('data');
		expect(response.body.data).toHaveProperty('docs');
		expect(Array.isArray(response.body.data.docs)).toBe(true);
	});

	test('deve responder GET /post/:id com token', async () => {
		expect(createdPostId).toBeTruthy();

		const response = await request(BASE_URL)
			.get(`/post/${createdPostId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('error', false);
		expect(response.body).toHaveProperty('data');

		const data = response.body.data;

		if (data?._id) {
			expect(data._id).toBe(createdPostId);
			return;
		}

		expect(Array.isArray(data?.docs)).toBe(true);
	});

	test('deve retornar 422 ao criar post com scope class sem target_id', async () => {
		const payload = {
			school_id: schoolId,
			title: `Post class sem target ${Date.now()}`,
			content: 'Teste de validação de regra de negócio para target_id.',
			target: {
				scope: 'class',
			},
			attachments: [],
			active: true,
		};

		const response = await request(BASE_URL)
			.post('/post')
			.set('Authorization', `Bearer ${token}`)
			.send(payload);

		expect(response.status).toBe(422);
		expect(response.body).toHaveProperty('error', true);
		expect(response.body).toHaveProperty(
			'message',
			'target_id não é válido ou está ausente.',
		);
	});

	test('deve retornar 422 ao criar post com target_id de class inexistente', async () => {
		const payload = {
			school_id: schoolId,
			title: `Post class inexistente ${Date.now()}`,
			content: 'Teste de class/turma inexistente no target.',
			target: {
				scope: 'class',
				target_id: '000000000000000000000000',
			},
			attachments: [],
			active: true,
		};

		const response = await request(BASE_URL)
			.post('/post')
			.set('Authorization', `Bearer ${token}`)
			.send(payload);

		expect(response.status).toBe(422);
		expect(response.body).toHaveProperty('error', true);
		expect(response.body).toHaveProperty('message', 'class_id não foi encontrado.');
	});
});
