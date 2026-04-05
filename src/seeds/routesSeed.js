import Rota from '../models/Route.js';

export default async function seedRoutes() {
  await Rota.deleteMany();

  const routesArray = [
    'users',
    'schools',
    'grupos',
    'rotas',
    'posts',
    'events',
    'daily-logs',
    'daily-log-templates',
    'conversations',
  ];

  const routes = routesArray.map((route) => ({
    route,
    domain: 'localhost',
    active: true,
    get: true,
    post: true,
    put: true,
    patch: true,
    delete: true,
  }));

  await Rota.collection.insertMany(routes);

  return Rota.find();
}
