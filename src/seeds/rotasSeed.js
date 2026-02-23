import Rota from '../models/Rota.js';

export default async function seedRotas() {
  // Remove
  await Rota.deleteMany();

  const rotas_array = [
    'rotas',
    'rotas:id',
    'grupos',
    'grupos:id',
    'usuarios',
    'usuarios:id',
    'usuarios:id/foto',
    'escolas',
    'escolas:id',
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
    rota,
    dominio: 'localhost',
    ativo: true,
    buscar: true,
    enviar: true,
    substituir: true,
    modificar: true,
    excluir: true,
  }));

  const result = await Rota.collection.insertMany(rotas);

  return Rota.find();
}
