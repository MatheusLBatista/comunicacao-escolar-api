jest.mock('../../../models/Post.js', () => ({
  __esModule: true,
  default: {
    insertOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    paginate: jest.fn(),
  },
}));

import PostModel from '../../../models/Post.js';
import PostRepository from '../../../repositories/PostRepository.js';
import { CustomError } from '../../../utils/helpers/index.js';

describe('PostRepository', () => {
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PostRepository();
  });

  describe('create', () => {
    it('deve criar um post com sucesso', async () => {
      const parsedData = {
        school_id: '507f1f77bcf86cd799439011',
        author_id: '507f1f77bcf86cd799439012',
        title: 'Comunicado',
        content: 'Conteúdo do post',
      };

      const createdPost = {
        _id: '507f1f77bcf86cd799439013',
        ...parsedData,
      };

      PostModel.insertOne.mockResolvedValue(createdPost);

      const result = await repository.create(parsedData);

      expect(PostModel.insertOne).toHaveBeenCalledWith(parsedData);
      expect(result).toEqual(createdPost);
    });

    it('deve propagar erro quando insertOne falhar', async () => {
      const parsedData = {
        school_id: '507f1f77bcf86cd799439021',
        author_id: '507f1f77bcf86cd799439022',
        title: 'Comunicado inválido',
        content: 'Conteúdo',
      };

      PostModel.insertOne.mockRejectedValue(new Error('erro no banco'));

      await expect(repository.create(parsedData)).rejects.toThrow(
        'erro no banco',
      );
      expect(PostModel.insertOne).toHaveBeenCalledWith(parsedData);
    });
  });

  describe('list', () => {
    it('deve buscar post por ID quando informado nos params', async () => {
      const mockReq = {
        params: { id: '507f1f77bcf86cd799439013' },
        query: {},
      };

      const post = {
        _id: '507f1f77bcf86cd799439013',
        title: 'Post 1',
        content: 'Content 1',
        toObject: jest.fn(() => ({
          _id: '507f1f77bcf86cd799439013',
          title: 'Post 1',
          content: 'Content 1',
        })),
      };

      PostModel.findById.mockResolvedValue(post);

      const result = await repository.list(mockReq);

      expect(PostModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439013',
        title: 'Post 1',
        content: 'Content 1',
      });
    });

    it('deve lançar erro 404 quando post por ID não for encontrado', async () => {
      const mockReq = {
        params: { id: '507f1f77bcf86cd799439013' },
        query: {},
      };

      PostModel.findById.mockResolvedValue(null);

      await expect(repository.list(mockReq)).rejects.toThrow(CustomError);
    });


  });

  describe('update', () => {
    it('deve atualizar post com userId quando passado (autor)', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439012';
      const parsedData = {
        title: 'Novo título',
        content: 'Novo conteúdo',
      };

      const updatedPost = {
        _id: postId,
        ...parsedData,
      };

      PostModel.findOneAndUpdate.mockResolvedValue(updatedPost);

      const result = await repository.update(postId, parsedData, userId);

      expect(PostModel.findOneAndUpdate).toHaveBeenCalledWith(
        { id: postId, author_id: userId },
        parsedData,
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedPost);
    });

    it('deve atualizar post sem userId (admin)', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const parsedData = {
        title: 'Novo título',
      };

      const updatedPost = {
        _id: postId,
        ...parsedData,
      };

      PostModel.findByIdAndUpdate.mockResolvedValue(updatedPost);

      const result = await repository.update(postId, parsedData);

      expect(PostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        postId,
        parsedData,
        { new: true },
      );
      expect(result).toEqual(updatedPost);
    });

    it('deve lançar erro 404 quando post não for encontrado (autor)', async () => {
      const postId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439012';

      PostModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        repository.update(postId, { title: 'Novo' }, userId),
      ).rejects.toThrow(CustomError);
    });

    it('deve lançar erro 404 quando post não for encontrado (admin)', async () => {
      const postId = '507f1f77bcf86cd799439013';

      PostModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        repository.update(postId, { title: 'Novo' }),
      ).rejects.toThrow(CustomError);
    });
  });
});
