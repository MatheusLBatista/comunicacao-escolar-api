import mongoose from 'mongoose';
import PostModel from '../../../models/Post.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Post Model', () => {
  beforeEach(async () => {
    await PostModel.deleteMany({});
  });

  describe('Validação de Campos', () => {
    it('deve criar um post com todos os campos obrigatórios', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado de Teste',
        content: 'Conteúdo do comunicado',
        target: { scope: 'all' },
        active: true,
      };

      const post = await PostModel.create(postData);

      expect(post._id).toBeDefined();
      expect(post.school_id.toString()).toBe(postData.school_id.toString());
      expect(post.author_id.toString()).toBe(postData.author_id.toString());
      expect(post.title).toBe(postData.title);
      expect(post.content).toBe(postData.content);
      expect(post.target.scope).toBe('all');
      expect(post.active).toBe(true);
    });

    it('deve falhar ao criar post sem título', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        content: 'Conteúdo sem título',
        target: { scope: 'all' },
      };

      await expect(PostModel.create(postData)).rejects.toThrow();
    });

    it('deve falhar ao criar post sem conteúdo', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Título sem conteúdo',
        target: { scope: 'all' },
      };

      await expect(PostModel.create(postData)).rejects.toThrow();
    });

    it('deve falhar ao criar post sem school_id', async () => {
      const postData = {
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado',
        content: 'Conteúdo',
        target: { scope: 'all' },
      };

      await expect(PostModel.create(postData)).rejects.toThrow();
    });

    it('deve falhar ao criar post sem author_id', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado',
        content: 'Conteúdo',
        target: { scope: 'all' },
      };

      await expect(PostModel.create(postData)).rejects.toThrow();
    });

    it('deve criar post com target.scope=class', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado para turma',
        content: 'Conteúdo',
        target: {
          scope: 'class',
          target_id: new mongoose.Types.ObjectId(),
        },
        active: true,
      };

      const post = await PostModel.create(postData);

      expect(post.target.scope).toBe('class');
      expect(post.target.target_id).toBeDefined();
    });

    it('deve criar post com attachments array vazio', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado',
        content: 'Conteúdo',
        target: { scope: 'all' },
        attachments: [],
      };

      const post = await PostModel.create(postData);

      expect(Array.isArray(post.attachments)).toBe(true);
      expect(post.attachments).toHaveLength(0);
    });

    it('deve criar post com attachments URLs', async () => {
      const attachmentUrl = 'https://example.com/arquivo.pdf';
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado com anexos',
        content: 'Conteúdo',
        target: { scope: 'all' },
        attachments: [attachmentUrl],
      };

      const post = await PostModel.create(postData);

      expect(post.attachments).toContain(attachmentUrl);
    });

    it('deve ter created_at e updated_at com valores padrão', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado',
        content: 'Conteúdo',
        target: { scope: 'all' },
      };

      const post = await PostModel.create(postData);

      expect(post.created_at).toBeDefined();
      expect(post.updated_at).toBeDefined();
      expect(post.created_at instanceof Date).toBe(true);
      expect(post.updated_at instanceof Date).toBe(true);
    });

    it('deve ter active=true como padrão', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado',
        content: 'Conteúdo',
        target: { scope: 'all' },
      };

      const post = await PostModel.create(postData);

      expect(post.active).toBe(true);
    });
  });

  describe('Métodos do Schema', () => {
    it('deve atualizar created_at e updated_at ao modificar', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado Original',
        content: 'Conteúdo original',
        target: { scope: 'all' },
      };

      const post = await PostModel.create(postData);
      const originalUpdatedAt = post.updated_at;

      // Aguardar um pouco para garantir mudança de tempo
      await new Promise((resolve) => setTimeout(resolve, 100));

      post.title = 'Comunicado Modificado';
      await post.save();

      expect(post.updated_at.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it('deve encontrar post por ID', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado',
        content: 'Conteúdo',
        target: { scope: 'all' },
      };

      const createdPost = await PostModel.create(postData);
      const foundPost = await PostModel.findById(createdPost._id);

      expect(foundPost).toBeDefined();
      expect(foundPost._id.toString()).toBe(createdPost._id.toString());
      expect(foundPost.title).toBe(postData.title);
    });

    it('deve atualizar post pelo ID', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado Original',
        content: 'Conteúdo original',
        target: { scope: 'all' },
      };

      const createdPost = await PostModel.create(postData);

      const updatedPost = await PostModel.findByIdAndUpdate(
        createdPost._id,
        {
          title: 'Comunicado Atualizado',
          content: 'Conteúdo atualizado',
        },
        { new: true, runValidators: true },
      );

      expect(updatedPost.title).toBe('Comunicado Atualizado');
      expect(updatedPost.content).toBe('Conteúdo atualizado');
    });

    it('deve deletar post pelo ID', async () => {
      const postData = {
        school_id: new mongoose.Types.ObjectId(),
        author_id: new mongoose.Types.ObjectId(),
        title: 'Comunicado para deletar',
        content: 'Conteúdo',
        target: { scope: 'all' },
      };

      const createdPost = await PostModel.create(postData);

      await PostModel.findByIdAndDelete(createdPost._id);

      const deletedPost = await PostModel.findById(createdPost._id);

      expect(deletedPost).toBeNull();
    });

    it('deve listar posts com paginação', async () => {
      // Criar múltiplos posts
      const schoolId = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();

      for (let i = 0; i < 15; i++) {
        await PostModel.create({
          school_id: schoolId,
          author_id: authorId,
          title: `Comunicado ${i}`,
          content: `Conteúdo ${i}`,
          target: { scope: 'all' },
        });
      }

      const result = await PostModel.paginate(
        { school_id: schoolId },
        { page: 1, limit: 10 },
      );

      expect(result.docs).toHaveLength(10);
      expect(result.totalDocs).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasNextPage).toBe(true);
    });

    it('deve filtrar posts por school_id', async () => {
      const schoolId1 = new mongoose.Types.ObjectId();
      const schoolId2 = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();

      await PostModel.create({
        school_id: schoolId1,
        author_id: authorId,
        title: 'Post Escola 1',
        content: 'Conteúdo',
        target: { scope: 'all' },
      });

      await PostModel.create({
        school_id: schoolId2,
        author_id: authorId,
        title: 'Post Escola 2',
        content: 'Conteúdo',
        target: { scope: 'all' },
      });

      const postsSchool1 = await PostModel.find({ school_id: schoolId1 });
      const postsSchool2 = await PostModel.find({ school_id: schoolId2 });

      expect(postsSchool1).toHaveLength(1);
      expect(postsSchool2).toHaveLength(1);
      expect(postsSchool1[0].school_id.toString()).toBe(schoolId1.toString());
      expect(postsSchool2[0].school_id.toString()).toBe(schoolId2.toString());
    });

    it('deve filtrar posts por author_id', async () => {
      const schoolId = new mongoose.Types.ObjectId();
      const authorId1 = new mongoose.Types.ObjectId();
      const authorId2 = new mongoose.Types.ObjectId();

      await PostModel.create({
        school_id: schoolId,
        author_id: authorId1,
        title: 'Post Autor 1',
        content: 'Conteúdo',
        target: { scope: 'all' },
      });

      await PostModel.create({
        school_id: schoolId,
        author_id: authorId2,
        title: 'Post Autor 2',
        content: 'Conteúdo',
        target: { scope: 'all' },
      });

      const postsAuthor1 = await PostModel.find({ author_id: authorId1 });
      const postsAuthor2 = await PostModel.find({ author_id: authorId2 });

      expect(postsAuthor1).toHaveLength(1);
      expect(postsAuthor2).toHaveLength(1);
    });

    it('deve filtrar por active status', async () => {
      const schoolId = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();

      await PostModel.create({
        school_id: schoolId,
        author_id: authorId,
        title: 'Post Ativo',
        content: 'Conteúdo',
        target: { scope: 'all' },
        active: true,
      });

      await PostModel.create({
        school_id: schoolId,
        author_id: authorId,
        title: 'Post Inativo',
        content: 'Conteúdo',
        target: { scope: 'all' },
        active: false,
      });

      const activePost = await PostModel.find({
        school_id: schoolId,
        active: true,
      });
      const inactivePost = await PostModel.find({
        school_id: schoolId,
        active: false,
      });

      expect(activePost).toHaveLength(1);
      expect(inactivePost).toHaveLength(1);
    });
  });

  describe('Índices e Performance', () => {
    it('deve permitir queries por school_id de forma eficiente', async () => {
      const schoolId = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();

      await PostModel.create({
        school_id: schoolId,
        author_id: authorId,
        title: 'Test Post',
        content: 'Content',
      });

      const result = await PostModel.find({ school_id: schoolId });

      expect(result).toHaveLength(1);
      expect(result[0].school_id.toString()).toBe(schoolId.toString());
    });

    it('deve permitir queries por author_id de forma eficiente', async () => {
      const schoolId = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();

      await PostModel.create({
        school_id: schoolId,
        author_id: authorId,
        title: 'Test Post',
        content: 'Content',
      });

      const result = await PostModel.find({ author_id: authorId });

      expect(result).toHaveLength(1);
      expect(result[0].author_id.toString()).toBe(authorId.toString());
    });
  });
});
