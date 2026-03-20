import PostService from '../../../services/PostService.js';
import PostRepository from '../../../repositories/PostRepository.js';
import SchoolRepository from '../../../repositories/SchoolRepository.js';
import { CustomError } from '../../../utils/helpers/index.js';

jest.mock('../../../repositories/PostRepository.js');
jest.mock('../../../repositories/SchoolRepository.js');

describe('PostService', () => {
	let service;
	let mockPostRepository;
	let mockSchoolRepository;

	beforeEach(() => {
		jest.clearAllMocks();

		service = new PostService();

		mockPostRepository = {
			createModel: jest.fn(),
		};

		mockSchoolRepository = {
			findById: jest.fn(),
		};

		service.repository = mockPostRepository;
		service.schoolRepository = mockSchoolRepository;
	});

	describe('createPost', () => {
		it('deve criar um post com sucesso quando o escopo do target for all', async () => {
			const parsedData = {
				school_id: '507f1f77bcf86cd799439011',
				author_id: '507f1f77bcf86cd799439012',
				title: 'Comunicado',
				content: 'Conteúdo do comunicado',
				target: { scope: 'all' },
			};

			const createdPost = { _id: '507f1f77bcf86cd799439013', ...parsedData };

			mockSchoolRepository.findById.mockResolvedValue({ _id: parsedData.school_id });
			mockPostRepository.createModel.mockResolvedValue(createdPost);

			const result = await service.createPost(parsedData);

			expect(mockSchoolRepository.findById).toHaveBeenCalledWith(
				parsedData.school_id,
			);
			expect(mockPostRepository.createModel).toHaveBeenCalledWith(parsedData);
			expect(result).toEqual(createdPost);
		});

		it('deve criar um post com sucesso quando o escopo do target for class e existir target_id', async () => {
			const parsedData = {
				school_id: '507f1f77bcf86cd799439021',
				author_id: '507f1f77bcf86cd799439022',
				title: 'Aviso para turma',
				content: 'Conteúdo para turma específica',
				target: {
					scope: 'class',
					target_id: '507f1f77bcf86cd799439023',
				},
			};

			const createdPost = { _id: '507f1f77bcf86cd799439024', ...parsedData };

			mockSchoolRepository.findById.mockResolvedValue({ _id: parsedData.school_id });
			mockPostRepository.createModel.mockResolvedValue(createdPost);

			const result = await service.createPost(parsedData);

			expect(mockPostRepository.createModel).toHaveBeenCalledWith(parsedData);
			expect(result).toEqual(createdPost);
		});

		it('deve lançar erro quando a escola não existir', async () => {
			const parsedData = {
				school_id: '507f1f77bcf86cd799439031',
				author_id: '507f1f77bcf86cd799439032',
				title: 'Comunicado',
				content: 'Conteúdo',
			};

			mockSchoolRepository.findById.mockResolvedValue(null);

			await expect(service.createPost(parsedData)).rejects.toThrow(CustomError);
			expect(mockPostRepository.createModel).not.toHaveBeenCalled();
		});

		it('deve lançar erro quando o escopo do target não for all e target_id estiver ausente', async () => {
			const parsedData = {
				school_id: '507f1f77bcf86cd799439041',
				author_id: '507f1f77bcf86cd799439042',
				title: 'Comunicado para turma',
				content: 'Conteúdo',
				target: {
					scope: 'class',
				},
			};

			mockSchoolRepository.findById.mockResolvedValue({ _id: parsedData.school_id });

			await expect(service.createPost(parsedData)).rejects.toThrow(CustomError);
			expect(mockPostRepository.createModel).not.toHaveBeenCalled();
		});
	});
});
