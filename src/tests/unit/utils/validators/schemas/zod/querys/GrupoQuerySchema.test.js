import {
  GroupIdSchema,
  GroupQuerySchema,
} from '../../../../../../../utils/validators/schemas/zod/querys/GroupQuerySchema.js';
import mongoose from 'mongoose';

describe('GroupIdSchema', () => {
  it('deve validar um ObjectId correto', () => {
    const idValido = new mongoose.Types.ObjectId().toString();
    expect(() => GroupIdSchema.parse(idValido)).not.toThrow();
  });

  it('deve invalidar um ObjectId incorreto', () => {
    const idInvalido = '12345';
    expect(() => GroupIdSchema.parse(idInvalido)).toThrow('ID inválido');
  });

  it('deve invalidar valores inválidos', () => {
    expect(() => GroupIdSchema.parse('')).toThrow('ID inválido');
    expect(() => GroupIdSchema.parse(null)).toThrow();
    expect(() => GroupIdSchema.parse(undefined)).toThrow();
  });
});

describe('GroupQuerySchema', () => {
  const consultaValida = {
    nome: 'Administradores',
    descricao: 'Grupo administrativo',
    ativo: 'true',
    page: '2',
    limite: '20',
  };

  it('deve validar um objeto de consulta correto', () => {
    expect(() => GroupQuerySchema.parse(consultaValida)).not.toThrow();
  });

  it('deve permitir campos opcionais ausentes', () => {
    expect(() => GroupQuerySchema.parse({})).not.toThrow();
  });

  it('deve remover espaços do nome e aceitar', () => {
    const consulta = { ...consultaValida, nome: '   Usuários   ' };
    const resultado = GroupQuerySchema.parse(consulta);
    expect(resultado.nome).toBe('Usuários');
  });

  it('deve invalidar nome vazio', () => {
    const consulta = { ...consultaValida, nome: '   ' };
    expect(() => GroupQuerySchema.parse(consulta)).toThrow(
      'Nome não pode ser vazio',
    );
  });

  it('deve remover espaços da descrição e aceitar', () => {
    const consulta = { ...consultaValida, descricao: '   Grupo de teste   ' };
    const resultado = GroupQuerySchema.parse(consulta);
    expect(resultado.descricao).toBe('Grupo de teste');
  });

  it('deve invalidar descrição vazia', () => {
    const consulta = { ...consultaValida, descricao: '   ' };
    expect(() => GroupQuerySchema.parse(consulta)).toThrow(
      'Descrição não pode ser vazio',
    );
  });

  it('deve processar ativo como string', () => {
    const consulta1 = { ...consultaValida, ativo: 'true' };
    const resultado1 = GroupQuerySchema.parse(consulta1);
    expect(resultado1.ativo).toBe('true');

    const consulta2 = { ...consultaValida, ativo: 'false' };
    const resultado2 = GroupQuerySchema.parse(consulta2);
    expect(resultado2.ativo).toBe('false');
  });

  it('deve rejeitar ativo como boolean', () => {
    expect(() =>
      GroupQuerySchema.parse({ ...consultaValida, ativo: true }),
    ).toThrow();
    expect(() =>
      GroupQuerySchema.parse({ ...consultaValida, ativo: false }),
    ).toThrow();
  });

  it('deve invalidar ativo com valor inválido', () => {
    const consulta = { ...consultaValida, ativo: 'maybe' };
    expect(() => GroupQuerySchema.parse(consulta)).toThrow();
  });

  it('deve validar paginação', () => {
    const consulta = { ...consultaValida, page: '5', limite: '25' };
    const resultado = GroupQuerySchema.parse(consulta);
    expect(resultado.page).toBe(5);
    expect(resultado.limite).toBe(25);
  });

  it('deve usar defaults de paginação', () => {
    const resultado = GroupQuerySchema.parse({});
    expect(resultado.page).toBe(1);
    expect(resultado.limite).toBe(10);
  });

  it('deve invalidar paginação inválida', () => {
    expect(() => GroupQuerySchema.parse({ page: '0' })).toThrow();
    expect(() => GroupQuerySchema.parse({ page: '-1' })).toThrow();
    expect(() => GroupQuerySchema.parse({ limite: '0' })).toThrow();
    expect(() => GroupQuerySchema.parse({ limite: '-5' })).toThrow();
    expect(() => GroupQuerySchema.parse({ page: 'abc' })).toThrow();
    expect(() => GroupQuerySchema.parse({ limite: 'xyz' })).toThrow();
  });

  it('deve processar consultas específicas', () => {
    const consulta1 = { nome: 'Operadores' };
    const resultado1 = GroupQuerySchema.parse(consulta1);
    expect(resultado1.nome).toBe('Operadores');
    expect(resultado1.page).toBe(1);
    expect(resultado1.limite).toBe(10);

    const consulta2 = {
      nome: 'Supervisores',
      descricao: 'Grupo de supervisão',
      ativo: 'false',
      page: '3',
      limite: '25',
    };
    const resultado2 = GroupQuerySchema.parse(consulta2);
    expect(resultado2).toEqual({
      nome: 'Supervisores',
      descricao: 'Grupo de supervisão',
      ativo: 'false',
      page: 3,
      limite: 25,
    });
  });
});
