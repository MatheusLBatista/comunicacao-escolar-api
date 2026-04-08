import PostService from '../../../services/PostService.js';
import PostRepository from '../../../repositories/PostRepository.js';
import SchoolRepository from '../../../repositories/SchoolRepository.js';
import ClassRepository from '../../../repositories/ClassRepository.js';
import UserRepository from '../../../repositories/UserRepository.js';
import { CustomError } from '../../../utils/helpers/index.js';

jest.mock('../../../repositories/PostRepository.js');
jest.mock('../../../repositories/SchoolRepository.js');
jest.mock('../../../repositories/ClassRepository.js');
jest.mock('../../../repositories/UserRepository.js');

describe('PostService', () => {
  let service;
  let mockPostRepository;
  let mockSchoolRepository;
  let mockClassRepository;
  let mockUserRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PostService();

    mockPostRepository = {
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    };

    mockSchoolRepository = {
      findById: jest.fn(),
    };

    mockClassRepository = {
      findById: jest.fn(),
    };

    mockUserRepository = {
      getById: jest.fn(),
    };

    service.repository = mockPostRepository;
    service.schoolRepository = mockSchoolRepository;
    service.classRepository = mockClassRepository;
    service.userRepository = mockUserRepository;
  });

  describe('create', () => {
    it('deve criar um post com sucesso quando target.scope for all', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const schoolId = '507f1f77bcf86cd799439011';
      const parsedData = {
        title: 'Comunicado',
        content: 'Conteúdo do comunicado',
        target: { scope: 'all' },
      };

      const createdPost = {
        _id: '507f1f77bcf86cd799439013',
        author_id: userId,
        school_id: schoolId,
        ...parsedData,
      };

      mockSchoolRepository.findById.mockResolvedValue({ _id: schoolId });
      mockPostRepository.create.mockResolvedValue(createdPost);

      const result = await service.create(parsedData, userId, schoolId);

      expect(mockSchoolRepository.findById).toHaveBeenCalledWith(schoolId);
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        ...parsedData,
        author_id: userId,
        school_id: schoolId,
      });
      expect(result).toEqual(createdPost);
    });

    it('deve criar post com target.scope=class e target_id válido', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const schoolId = '507f1f77bcf86cd799439011';
      const classId = '507f1f77bcf86cd799439023';
      const parsedData = {
        title: 'Aviso para turma',
        content: 'Conteúdo para turma específica',
        target: {
          scope: 'class',
          target_id: classId,
        },
      };

      const createdPost = {
        _id: '507f1f77bcf86cd799439024',
        ...parsedData,
        author_id: userId,
        school_id: schoolId,
      };

      mockSchoolRepository.findById.mockResolvedValue({ _id: schoolId });
      mockClassRepository.findById.mockResolvedValue({ _id: classId });
      mockPostRepository.create.mockResolvedValue(createdPost);

      const result = await service.create(parsedData, userId, schoolId);

      expect(mockSchoolRepository.findById).toHaveBeenCalledWith(schoolId);
      expect(mockClassRepository.findById).toHaveBeenCalledWith(classId);
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        ...parsedData,
        author_id: userId,
        school_id: schoolId,
      });
      expect(result).toEqual(createdPost);
    });

    it('deve lançar erro quando a escola não existir', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const schoolId = '507f1f77bcf86cd799439031';
      const parsedData = {
        title: 'Comunicado',
        content: 'Conteúdo',
      };

      mockSchoolRepository.findById.mockResolvedValue(null);

      await expect(service.create(parsedData, userId, schoolId)).rejects.toThrow(
        CustomError,
      );
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando target.scope=class mas target_id estiver ausente', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const schoolId = '507f1f77bcf86cd799439011';
      const parsedData = {
        title: 'Comunicado para turma',
        content: 'Conteúdo',
        target: {
          scope: 'class',
        },
      };

      mockSchoolRepository.findById.mockResolvedValue({ _id: schoolId });

      await expect(service.create(parsedData, userId, schoolId)).rejects.toThrow(
        CustomError,
      );
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando turma/class não existir', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const schoolId = '507f1f77bcf86cd799439011';
      const classId = '507f1f77bcf86cd799439023';
      const parsedData = {
        title: 'Comunicado para turma',
        content: 'Conteúdo',
        target: {
          scope: 'class',
          target_id: classId,
        },
      };

      mockSchoolRepository.findById.mockResolvedValue({ _id: schoolId });
      mockClassRepository.findById.mockResolvedValue(null);

      await expect(service.create(parsedData, userId, schoolId)).rejects.toThrow(
        CustomError,
      );
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('deve listar posts com sucesso', async () => {
      const mockReq = {
        query: { page: 1, limit: 10 },
        params: { schoolId: '507f1f77bcf86cd799439011' },
      };

      const postsList = {
        docs: [
          { _id: '1', title: 'Post 1', content: 'Content 1' },
          { _id: '2', title: 'Post 2', content: 'Content 2' },
        ],
        totalDocs: 2,
        page: 1,
        limit: 10,
      };

      mockPostRepository.list.mockResolvedValue(postsList);

      const result = await service.list(mockReq);

      expect(mockPostRepository.list).toHaveBeenCalledWith(mockReq);
      expect(result).toEqual(postsList);
    });

    it('deve propagar erro do repository na listagem', async () => {
      const mockReq = { query: {}, params: {} };

      mockPostRepository.list.mockRejectedValueOnce(
        new Error('Erro na query'),
      );

      await expect(service.list(mockReq)).rejects.toThrow('Erro na query');
    });
  });

  describe('update', () => {

    it('deve validar target_id quando admin atualiza para scope=class', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439012';
      const classId = '507f1f77bcf86cd799439023';
      const parsedData = {
        title: 'Novo título',
        target: {
          scope: 'class',
          target_id: classId,
        },
      };

      mockUserRepository.getById.mockResolvedValue({
        memberships: [{ role: 'admin' }],
      });
      mockClassRepository.findById.mockResolvedValue({ _id: classId });

      const updatedPost = { _id: postId, ...parsedData };
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.update(postId, parsedData, userId);

      expect(mockClassRepository.findById).toHaveBeenCalledWith(classId);
      expect(result).toEqual(updatedPost);
    });

    it('deve lançar erro quando admin tenta atualizar para class sem target_id', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439012';
      const parsedData = {
        target: { scope: 'class' },
      };

      mockUserRepository.getById.mockResolvedValue({
        memberships: [{ role: 'admin' }],
      });

      await expect(
        service.update(postId, parsedData, userId),
      ).rejects.toThrow(CustomError);
    });

    it('deve atualizar post quando autor for não-admin e for o dono', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439012';
      const parsedData = {
        title: 'Novo título',
      };

      const updatedPost = {
        _id: postId,
        title: 'Novo título',
      };

      mockUserRepository.getById.mockResolvedValue({
        memberships: [{ role: 'teacher' }],
      });
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.update(postId, parsedData, userId);

      expect(mockPostRepository.update).toHaveBeenCalledWith(
        postId,
        parsedData,
        userId,
      );
      expect(result).toEqual(updatedPost);
    });

    it('deve propagar erro do repository na atualização', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439012';
      const parsedData = { title: 'Novo título' };

      mockUserRepository.getById.mockResolvedValue({
        memberships: [{ role: 'teacher' }],
      });
      mockPostRepository.update.mockRejectedValueOnce(
        new Error('Post não encontrado'),
      );

      await expect(service.update(postId, parsedData, userId)).rejects.toThrow(
        'Post não encontrado',
      );
    });
  });
});
