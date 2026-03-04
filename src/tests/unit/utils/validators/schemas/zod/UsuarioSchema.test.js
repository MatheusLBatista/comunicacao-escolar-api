import {
  UsuarioSchema,
  UsuarioUpdateSchema,
} from '../../../../../../utils/validators/schemas/zod/UsuarioSchema.js';

describe('UsuarioSchema', () => {
  it('deve validar dados válidos corretamente', () => {
    const dadosValidos = {
      full_name: 'João Silva',
      email: 'joao@email.com',
      password: 'Senha@123',
      active: false,
    };
    const resultado = UsuarioSchema.parse(dadosValidos);
    expect(resultado).toEqual(dadosValidos);
  });

  it('deve aplicar valor padrão para "ativo" quando não fornecido', () => {
    const dadosValidos = {
      full_name: 'Maria',
      email: 'maria@email.com',
      password: 'Senha@123',
    };
    const resultado = UsuarioSchema.parse(dadosValidos);
    expect(resultado.active).toBe(true);
  });

  it('deve lançar erro quando "nome" está ausente', () => {
    const dadosInvalidos = {
      email: 'joao@email.com',
      password: 'Senha@123',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(/Required/);
  });

  it('deve lançar erro quando "nome" está vazio', () => {
    const dadosInvalidos = {
      full_name: '',
      email: 'joao@email.com',
      password: 'Senha@123',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(/obrigat/);
  });

  it('deve lançar erro quando "email" está ausente', () => {
    const dadosInvalidos = {
      full_name: 'João',
      password: 'Senha@123',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(/Required/);
  });

  it('deve lançar erro quando "email" está vazio', () => {
    const dadosInvalidos = {
      full_name: 'João',
      email: '',
      password: 'Senha@123',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(/obrigat/);
  });

  it('deve lançar erro quando "email" é inválido', () => {
    const dadosInvalidos = {
      full_name: 'João',
      email: 'joaoemail.com',
      password: 'Senha@123',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(
      /email.*inválido/,
    );
  });

  it('deve lançar erro quando "senha" é muito curta', () => {
    const dadosInvalidos = {
      full_name: 'João',
      email: 'joao@email.com',
      password: 'S@1a',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(
      /senha.*8 caracteres/,
    );
  });

  it('deve lançar erro quando "senha" não atende à complexidade', () => {
    const dadosInvalidos = {
      full_name: 'João',
      email: 'joao@email.com',
      password: 'senhasimples',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(
      /senha.*maiúscula.*minúscula.*número.*especial/,
    );
  });

  it('deve lançar erro quando "senha" está vazia', () => {
    const dadosInvalidos = {
      full_name: 'João',
      email: 'joao@email.com',
      password: '',
      active: true,
    };
    expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrow(/8 caracteres/);
  });
});

describe('UsuarioUpdateSchema', () => {
  it('deve validar dados parciais corretamente', () => {
    const dadosParciais = { full_name: 'Novo Nome' };
    const resultado = UsuarioUpdateSchema.parse(dadosParciais);
    expect(resultado.full_name).toBe('Novo Nome');
    expect(resultado.password).toBeUndefined();
    expect(resultado.active).toBeUndefined();
  });

  it('deve aceitar objeto vazio e manter campos indefinidos', () => {
    const resultado = UsuarioUpdateSchema.parse({});
    expect(resultado.full_name).toBeUndefined();
    expect(resultado.password).toBeUndefined();
    expect(resultado.active).toBeUndefined();
  });

  it('deve lançar erro quando "senha" é muito curta', () => {
    const dadosInvalidos = { password: 'S@1a' };
    expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrow(
      /senha.*8 caracteres/,
    );
  });

  it('deve lançar erro quando "senha" não atende à complexidade', () => {
    const dadosInvalidos = { password: 'senhasimples' };
    expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrow(
      /senha.*maiúscula.*minúscula.*número.*especial/,
    );
  });

  it('deve lançar erro quando "senha" está vazia', () => {
    const dadosInvalidos = { password: '' };
    expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrow(
      /8 caracteres/,
    );
  });
});
