jest.mock('../../../models/Post.js', () => ({
  __esModule: true,
  default: {
    insertOne: jest.fn(),
  },
}));

import PostModel from '../../../models/Post.js';
import PostRepository from '../../../repositories/PostRepository.js';

describe('PostRepository', () => {
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PostRepository();
  });

  describe('createModel', () => {
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

      const result = await repository.createModel(parsedData);

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

      await expect(repository.createModel(parsedData)).rejects.toThrow(
        'erro no banco',
      );
      expect(PostModel.insertOne).toHaveBeenCalledWith(parsedData);
    });
  });
});
