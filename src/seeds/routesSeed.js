import Rota from '../models/Route.js';

export default async function seedRoutes() {
  await Rota.deleteMany();

  const routesArray = [
    'users',
    'schools',
    'grupos',
    'rotas',
    'posts',
    'likes',
    'events',
    'daily-logs',
    'daily-log-templates',
    'conversations',
    'pickup-authorizations',
    'pickup-logs',
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
