import PostController from '../../../controllers/PostController.js';
import PostService from '../../../services/PostService.js';
import { CommonResponse } from '../../../utils/helpers/index.js';
import { PostSchemaInput } from '../../../utils/validators/schemas/zod/PostSchema.js';

jest.mock('../../../services/PostService.js');
jest.mock('../../../utils/helpers/index.js', () => ({
	CommonResponse: {
		created: jest.fn(),
		success: jest.fn(),
	},
}));
jest.mock('../../../utils/validators/schemas/zod/PostSchema.js', () => ({
	PostSchema: { parse: jest.fn((data) => data) },
	PostSchemaInput: { parse: jest.fn((data) => data) },
}));

describe('PostController', () => {
	let controller;
	let mockService;
	let mockReq;
	let mockRes;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new PostController();

		mockService = PostService.mock.instances[0] || {
			createPost: jest.fn(),
		};
		controller.service = mockService;

		mockReq = {
			body: {
				school_id: '507f1f77bcf86cd799439011',
				title: 'Aviso importante',
				content: 'Conteúdo do aviso',
				target: { scope: 'all' },
			},
			user_id: '507f1f77bcf86cd799439012',
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
	});

	describe('createPost', () => {
		it('deve criar um post com sucesso', async () => {
			const createdPost = {
				_id: '507f1f77bcf86cd799439013',
				...mockReq.body,
				author_id: mockReq.user_id,
			};

			mockService.createPost.mockResolvedValue(createdPost);
			CommonResponse.created.mockReturnValue(mockRes);

			await controller.createPost(mockReq, mockRes);

			expect(PostSchemaInput.parse).toHaveBeenCalledWith(
				expect.objectContaining({
					...mockReq.body,
					author_id: mockReq.user_id,
				}),
			);
			expect(mockService.createPost).toHaveBeenCalledWith(
				expect.objectContaining({
					...mockReq.body,
					author_id: mockReq.user_id,
				}),
			);
			expect(CommonResponse.created).toHaveBeenCalledWith(mockRes, createdPost);
		});

		it('deve sobrescrever author_id do body com req.user_id', async () => {
			mockReq.body.author_id = '507f1f77bcf86cd799439099';
			mockService.createPost.mockResolvedValue({ ok: true });

			await controller.createPost(mockReq, mockRes);

			expect(PostSchemaInput.parse).toHaveBeenCalledWith(
				expect.objectContaining({
					author_id: mockReq.user_id,
				}),
			);
		});

		it('deve lançar erro quando a validação de schema falhar', async () => {
			PostSchemaInput.parse.mockImplementationOnce(() => {
				throw new Error('schema inválido');
			});

			await expect(controller.createPost(mockReq, mockRes)).rejects.toThrow(
				'schema inválido',
			);

			expect(mockService.createPost).not.toHaveBeenCalled();
		});

		it('deve propagar erros do service', async () => {
			mockService.createPost.mockRejectedValueOnce(new Error('erro no service'));

			await expect(controller.createPost(mockReq, mockRes)).rejects.toThrow(
				'erro no service',
			);
		});

		it('deve criar post quando target não for informado', async () => {
			const bodyWithoutTarget = {
				school_id: '507f1f77bcf86cd799439021',
				title: 'Comunicado sem target',
				content: 'Conteúdo sem target explícito',
			};

			mockReq.body = bodyWithoutTarget;

			const createdPost = {
				_id: '507f1f77bcf86cd799439022',
				...bodyWithoutTarget,
				author_id: mockReq.user_id,
			};

			mockService.createPost.mockResolvedValue(createdPost);
			CommonResponse.created.mockReturnValue(mockRes);

			await controller.createPost(mockReq, mockRes);

			expect(PostSchemaInput.parse).toHaveBeenCalledWith(
				expect.objectContaining({
					...bodyWithoutTarget,
					author_id: mockReq.user_id,
				}),
			);
			expect(mockService.createPost).toHaveBeenCalledWith(
				expect.objectContaining({
					...bodyWithoutTarget,
					author_id: mockReq.user_id,
				}),
			);
			expect(CommonResponse.created).toHaveBeenCalledWith(mockRes, createdPost);
		});
	});
});
