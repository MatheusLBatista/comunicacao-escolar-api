import Rota from '../models/Route.js';

export default async function seedRoutes() {
  await Rota.deleteMany();

  const rotas_array = [
    'rotas',
    'rotas:id',
    'grupos',
    'grupos:id',
    'usuarios',
    'usuarios:id',
    'usuarios:id/foto',
    'users',
    'users:id',
    'escolas',
    'escolas:id',
    'schools',
    'schools:id',
    'posts',
    'posts:id',
    'daily-logs',
    'daily-logs:id',
    'daily-log-templates',
    'daily-log-templates:id',
    'conversas',
    'conversas:id',
    'mensagens',
    'mensagens:id',
  ];

  const rotas = rotas_array.map((rota) => ({
    route: rota,
    domain: 'localhost',
    active: true,
    get: true,
    post: true,
    put: true,
    patch: true,
    delete: true,
  }));

  const result = await Rota.collection.insertMany(rotas);

  return Rota.find();
}
