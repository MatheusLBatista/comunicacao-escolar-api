import PostController from '../../../controllers/PostController.js';
import PostService from '../../../services/PostService.js';
import { CommonResponse } from '../../../utils/helpers/index.js';
import { PostSchemaInput, PostSchemaUpdate } from '../../../utils/validators/schemas/zod/PostSchema.js';
import ObjectIdSchema from '../../../utils/validators/schemas/zod/ObjectIdSchema.js';
import { UserIdSchema } from '../../../utils/validators/schemas/zod/querys/UserQuerySchema.js';
import { PostQuerySchema } from '../../../utils/validators/schemas/zod/querys/PostQuerySchema.js';

jest.mock('../../../services/PostService.js');
jest.mock('../../../utils/helpers/index.js', () => ({
  CommonResponse: {
    created: jest.fn(),
    success: jest.fn(),
  },
}));
jest.mock('../../../utils/validators/schemas/zod/PostSchema.js', () => ({
  PostSchemaInput: { parse: jest.fn((data) => data) },
  PostSchemaUpdate: { parse: jest.fn((data) => data) },
}));
jest.mock('../../../utils/validators/schemas/zod/ObjectIdSchema.js', () => ({
  parse: jest.fn((data) => data),
  default: {
    parse: jest.fn((data) => data),
  },
}));
jest.mock('../../../utils/validators/schemas/zod/querys/UserQuerySchema.js', () => ({
  UserIdSchema: { parse: jest.fn((data) => data) },
}));
jest.mock('../../../utils/validators/schemas/zod/querys/PostQuerySchema.js', () => ({
  PostQuerySchema: { safeParseAsync: jest.fn((data) => ({ success: true, data })) },
}));

describe('PostController', () => {
  let controller;
  let mockService;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PostController();

    mockService = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    controller.service = mockService;

    mockRes = {};
  });

  describe('create', () => {
    it('deve criar um post com sucesso', async () => {
      const mockReq = {
        params: { schoolId: '507f1f77bcf86cd799439011' },
        body: {
          title: 'Comunicado',
          content: 'Conteúdo do post',
        },
        user_id: '507f1f77bcf86cd799439012',
      };

      const createdPost = {
        _id: '507f1f77bcf86cd799439013',
        school_id: '507f1f77bcf86cd799439011',
        author_id: '507f1f77bcf86cd799439012',
        title: 'Comunicado',
        content: 'Conteúdo do post',
      };

      mockService.create.mockResolvedValue(createdPost);
      CommonResponse.created.mockReturnValue(mockRes);

      await controller.create(mockReq, mockRes);

      expect(ObjectIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(PostSchemaInput.parse).toHaveBeenCalledWith({
        title: 'Comunicado',
        content: 'Conteúdo do post',
      });
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Comunicado',
          content: 'Conteúdo do post',
        }),
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      );
      expect(CommonResponse.created).toHaveBeenCalledWith(mockRes, createdPost);
    });

    it('deve propagar erro quando schoolId for inválido', async () => {
      const mockReq = {
        params: { schoolId: 'invalid-id' },
        body: { title: 'Test', content: 'Test' },
        user_id: '507f1f77bcf86cd799439012',
      };

      ObjectIdSchema.parse.mockImplementationOnce(() => {
        throw new Error('ObjectId inválido');
      });

      await expect(controller.create(mockReq, mockRes)).rejects.toThrow(
        'ObjectId inválido',
      );
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('deve propagar erro de validação de schema', async () => {
      const mockReq = {
        params: { schoolId: '507f1f77bcf86cd799439011' },
        body: { title: '', content: '' },
        user_id: '507f1f77bcf86cd799439012',
      };

      PostSchemaInput.parse.mockImplementationOnce(() => {
        throw new Error('Validação falhou');
      });

      await expect(controller.create(mockReq, mockRes)).rejects.toThrow(
        'Validação falhou',
      );
    });

    it('deve propagar erro do service', async () => {
      const mockReq = {
        params: { schoolId: '507f1f77bcf86cd799439011' },
        body: { title: 'Test', content: 'Test' },
        user_id: '507f1f77bcf86cd799439012',
      };

      mockService.create.mockRejectedValueOnce(new Error('Erro no service'));

      await expect(controller.create(mockReq, mockRes)).rejects.toThrow(
        'Erro no service',
      );
    });
  });

  describe('list', () => {
    it('deve listar posts com query parameters', async () => {
      const mockReq = {
        params: { schoolId: '507f1f77bcf86cd799439011' },
        query: { page: 1, limit: 10 },
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

      mockService.list.mockResolvedValue(postsList);
      CommonResponse.success.mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(PostQuerySchema.safeParseAsync).toHaveBeenCalled();
      expect(mockService.list).toHaveBeenCalledWith(mockReq);
      expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, postsList);
    });

    it('deve buscar post por ID', async () => {
      const mockReq = {
        params: { id: '507f1f77bcf86cd799439013' },
        query: {},
      };

      const post = {
        _id: '507f1f77bcf86cd799439013',
        title: 'Post 1',
        content: 'Content 1',
      };

      mockService.list.mockResolvedValue(post);
      CommonResponse.success.mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(UserIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(mockService.list).toHaveBeenCalledWith(mockReq);
      expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, post);
    });

    it('deve validar schoolId se presente nos params', async () => {
      const mockReq = {
        params: { schoolId: '507f1f77bcf86cd799439011' },
        query: {},
      };

      mockService.list.mockResolvedValue([]);
      CommonResponse.success.mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(UserIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('deve listar sem aparâmetros opcionais', async () => {
      const mockReq = {
        params: {},
        query: {},
      };

      mockService.list.mockResolvedValue({ docs: [] });
      CommonResponse.success.mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(mockService.list).toHaveBeenCalledWith(mockReq);
      expect(CommonResponse.success).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar um post com sucesso', async () => {
      const mockReq = {
        params: { id: '507f1f77bcf86cd799439013' },
        body: {
          title: 'Novo título',
          content: 'Novo conteúdo',
        },
        user_id: '507f1f77bcf86cd799439012',
      };

      const updatedPost = {
        _id: '507f1f77bcf86cd799439013',
        title: 'Novo título',
        content: 'Novo conteúdo',
        school_id: '507f1f77bcf86cd799439011',
      };

      mockService.update.mockResolvedValue(updatedPost);
      CommonResponse.success.mockReturnValue(mockRes);

      await controller.update(mockReq, mockRes);

      expect(UserIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(PostSchemaUpdate.parse).toHaveBeenCalledWith({
        title: 'Novo título',
        content: 'Novo conteúdo',
      });
      expect(mockService.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        expect.objectContaining({
          title: 'Novo título',
          content: 'Novo conteúdo',
        }),
        '507f1f77bcf86cd799439012',
      );
      expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, updatedPost);
    });

    it('deve propagar erro quando ID for inválido', async () => {
      const mockReq = {
        params: { id: 'invalid-id' },
        body: { title: 'Test' },
        user_id: '507f1f77bcf86cd799439012',
      };

      UserIdSchema.parse.mockImplementationOnce(() => {
        throw new Error('ID inválido');
      });

      await expect(controller.update(mockReq, mockRes)).rejects.toThrow(
        'ID inválido',
      );
    });

    it('deve propagar erro de validação do schema de update', async () => {
      const mockReq = {
        params: { id: '507f1f77bcf86cd799439013' },
        body: { invalid_field: 'value' },
        user_id: '507f1f77bcf86cd799439012',
      };

      PostSchemaUpdate.parse.mockImplementationOnce(() => {
        throw new Error('Schema inválido');
      });

      await expect(controller.update(mockReq, mockRes)).rejects.toThrow(
        'Schema inválido',
      );
    });

    it('deve propagar erro do service na atualização', async () => {
      const mockReq = {
        params: { id: '507f1f77bcf86cd799439013' },
        body: { title: 'New title' },
        user_id: '507f1f77bcf86cd799439012',
      };

      mockService.update.mockRejectedValueOnce(new Error('Post não encontrado'));

      await expect(controller.update(mockReq, mockRes)).rejects.toThrow(
        'Post não encontrado',
      );
    });
  });
});
