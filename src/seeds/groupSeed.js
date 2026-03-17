import Grupo from '../models/Group.js';

export default async function seedGroups(rotas) {
  await Grupo.deleteMany();

  const groups = [];

  const adminGroup = {
    nome: 'Administrador',
    descricao: 'Grupo com acesso total a todas as rotas',
    ativo: true,
    permissions: rotas.map((r) => ({ ...r.toObject(), _id: r._id })),
  };
  groups.push(adminGroup);

  const basicGroup = {
    nome: 'BasicUser',
    descricao: 'Grupo base para usuários não administradores',
    ativo: true,
    permissions: rotas.map((r) => {
      if (r.route === 'users' || r.route === 'grupos' || r.route === 'rotas') {
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
  groups.push(basicGroup);

  await Grupo.collection.insertMany(groups);

  // Retorna grupos atualizados
  return Grupo.find();
}
