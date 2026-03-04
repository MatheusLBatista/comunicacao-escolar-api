import Grupo from '../models/Grupo.js';

export default async function seedGrupos(rotas) {
  await Grupo.deleteMany();

  const grupos = [];

  const grupoAdministrador = {
    nome: 'Administrador',
    descricao: 'Grupo com acesso total a todas as rotas',
    ativo: true,
    permissions: rotas.map((r) => ({ ...r.toObject(), _id: r._id })),
  };
  grupos.push(grupoAdministrador);

  const grupoVisitante = {
    nome: 'User',
    descricao: 'Grupo com acesso aos visualização de pontos históricos',
    ativo: true,
    permissions: rotas.map((r) => {
      if (
        r.route === 'usuarios' ||
        r.route === 'usuarios:id' ||
        r.route === 'grupos' ||
        r.route === 'grupos:id' ||
        r.route === 'rotas' ||
        r.route === 'rotas:id'
      ) {
        return {
          ...r.toObject(),
          _id: r._id,
          active: false,
          get: false,
          post: false,
          patch: false,
          put: false,
          delete: false,
        };
      }
      return {
        ...r.toObject(),
        _id: r._id,
        get: true,
        post: true,
        patch: true,
        put: true,
        delete: true,
      };
    }),
  };
  grupos.push(grupoVisitante);

  const result = await Grupo.collection.insertMany(grupos);

  // Retorna grupos atualizados
  return Grupo.find();
}
