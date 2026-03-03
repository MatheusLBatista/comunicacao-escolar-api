import mongoose from 'mongoose';
import Usuario from '../../../../src/models/Usuario.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

describe('Model de Usuário', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Garantir que o índice único para email seja criado
    await mongoose.connection.db
      .collection('usuarios')
      .createIndex({ email: 1 }, { unique: true });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Usuario.deleteMany({});
  });

  it('deve criar um usuário válido e definir ativo como false por padrão', async () => {
    const userData = {
      full_name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      password: 'senha123',
    };
    const user = new Usuario(userData);
    await user.save();
    const savedUser = await Usuario.findById(user._id);
    expect(savedUser.full_name).toBe(userData.full_name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.active).toBe(false);
    expect(savedUser._id).toBeDefined();
  });

  it('não deve criar usuário sem nome, email ou senha', async () => {
    const noNome = new Usuario({ email: 'a@a.com', password: '123' });
    await expect(noNome.save()).rejects.toThrow();
    const noEmail = new Usuario({ full_name: 'A', password: '123' });
    await expect(noEmail.save()).rejects.toThrow();
    const noSenha = new Usuario({ full_name: 'A', email: 'a@a.com' });
    await expect(noSenha.save()).rejects.toThrow();
  });
  it('não deve criar usuário com email duplicado', async () => {
    const userData = { full_name: 'A', email: 'dup@a.com', password: '123' };
    await new Usuario(userData).save();

    // Espera especificamente por um erro do MongoDB relacionado a duplicação
    try {
      await new Usuario(userData).save();
      fail('Deveria ter lançado um erro de duplicação');
    } catch (error) {
      // Verifica se a mensagem contém indicação de erro de duplicação
      expect(error.message).toMatch(/E11000|duplicate|duplic/i);
    }
  });

  it('deve retornar todos os usuários cadastrados', async () => {
    await Usuario.create([
      { full_name: 'U1', email: 'u1@a.com', password: '123' },
      { full_name: 'U2', email: 'u2@a.com', password: '123' },
    ]);
    const users = await Usuario.find();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.email)).toEqual(
      expect.arrayContaining(['u1@a.com', 'u2@a.com']),
    );
  });

  it('por padrão, o campo senha não deve ser retornado em queries', async () => {
    const userData = { full_name: 'SemSenha', email: 'sem@a.com', password: '123' };
    const user = new Usuario(userData);
    await user.save();
    const found = await Usuario.findById(user._id);
    expect(found.password).toBeUndefined();
    const foundWithPassword = await Usuario.findById(user._id).select('+password');
    expect(foundWithPassword.password).toBeDefined();
  });
});
