import PostFilterBuilder from '../../../../repositories/filters/PostFilterBuilder.js';

describe('PostFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new PostFilterBuilder();
  });

  it('deve retornar um objeto de filtro vazio por padrão', () => {
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro por school_id', () => {
    builder.withSchoolId('507f1f77bcf86cd799439011');
    const filters = builder.build();
    expect(filters).toEqual({ school_id: '507f1f77bcf86cd799439011' });
  });

  it('não deve adicionar filtro por school_id se vazio', () => {
    builder.withSchoolId('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('não deve adicionar filtro por school_id se undefined', () => {
    builder.withSchoolId(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro por author_id', () => {
    builder.withAuthorId('507f1f77bcf86cd799439012');
    const filters = builder.build();
    expect(filters).toEqual({ author_id: '507f1f77bcf86cd799439012' });
  });

  it('não deve adicionar filtro por author_id se vazio', () => {
    builder.withAuthorId('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro por title com regex case-insensitive', () => {
    builder.withTitle('Comunicado');
    const filters = builder.build();
    expect(filters).toEqual({
      title: { $regex: 'Comunicado', $options: 'i' },
    });
  });

  it('não deve adicionar filtro por title se vazio', () => {
    builder.withTitle('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro por content com regex case-insensitive', () => {
    builder.withContent('reunião');
    const filters = builder.build();
    expect(filters).toEqual({
      content: { $regex: 'reunião', $options: 'i' },
    });
  });

  it('não deve adicionar filtro por content se vazio', () => {
    builder.withContent('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro por target scope', () => {
    builder.withScope('all');
    const filters = builder.build();
    expect(filters).toEqual({
      'target.scope': { $regex: 'all', $options: 'i' },
    });
  });

  it('deve adicionar filtro por target scope=class', () => {
    builder.withScope('class');
    const filters = builder.build();
    expect(filters).toEqual({
      'target.scope': { $regex: 'class', $options: 'i' },
    });
  });

  it('não deve adicionar filtro por scope se vazio', () => {
    builder.withScope('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro por target_id', () => {
    const targetId = '507f1f77bcf86cd799439023';
    builder.withTargetId(targetId);
    const filters = builder.build();
    expect(filters).toEqual({
      'target.target_id': targetId,
    });
  });

  it('não deve adicionar filtro por target_id se vazio', () => {
    builder.withTargetId('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve adicionar filtro active=true quando active="true"', () => {
    builder.withActive('true');
    const filters = builder.build();
    expect(filters).toEqual({ active: true });
  });

  it('deve adicionar filtro active=false quando active="false"', () => {
    builder.withActive('false');
    const filters = builder.build();
    expect(filters).toEqual({ active: false });
  });

  it('não deve adicionar filtro active para valor inválido', () => {
    builder.withActive('invalid');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('não deve adicionar filtro active se vazio', () => {
    builder.withActive('');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('não deve adicionar filtro active se undefined', () => {
    builder.withActive(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('deve combinar múltiplos filtros', () => {
    builder
      .withSchoolId('507f1f77bcf86cd799439011')
      .withAuthorId('507f1f77bcf86cd799439012')
      .withTitle('Comunicado')
      .withActive('true');

    const filters = builder.build();

    expect(filters).toEqual({
      school_id: '507f1f77bcf86cd799439011',
      author_id: '507f1f77bcf86cd799439012',
      title: { $regex: 'Comunicado', $options: 'i' },
      active: true,
    });
  });

  it('deve retornar a instância para permitir encadeamento de métodos', () => {
    const result = builder.withSchoolId('507f1f77bcf86cd799439011');
    expect(result).toBe(builder);
  });
});
