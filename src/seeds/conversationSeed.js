import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import School from '../models/School.js';
import User from '../models/User.js';

function buildRoleFilter(schoolId, role) {
  return {
    active: true,
    memberships: {
      $elemMatch: {
        school_id: schoolId,
        role,
      },
    },
  };
}

export default async function conversationSeed() {
  await Conversation.deleteMany({});

  const school = await School.findOne({ active: true }).sort({ created_at: 1 });

  if (!school) {
    console.log('Nenhuma escola ativa encontrada para seed de conversations.');
    return { insertedCount: 0 };
  }

  const [teachers, parents] = await Promise.all([
    User.find(buildRoleFilter(school._id, 'teacher')),
    User.find(buildRoleFilter(school._id, 'parent')),
  ]);

  if (!teachers.length || !parents.length) {
    console.log(
      'Seed de conversations ignorada: faltam professores ou responsáveis para a escola ativa.',
    );
    return { insertedCount: 0, schoolId: school._id };
  }

  const now = Date.now();
  const conversations = [];

  for (let i = 0; i < Math.min(teachers.length, parents.length); i++) {
    conversations.push({
      school_id: school._id,
      participants: [teachers[i]._id, parents[i]._id],
      type: 'private',
      last_message_at: new Date(now - i * 60 * 60 * 1000),
      active: true,
    });
  }

  if (!conversations.length) {
    return { insertedCount: 0, schoolId: school._id };
  }

  // Primeira conversa — ID fixo para facilitar exemplos na Swagger
  if (conversations.length > 0) {
    conversations[0]._id = new mongoose.Types.ObjectId(
      '664eff007080901020301001',
    );
  }

  const result = await Conversation.collection.insertMany(conversations);

  console.log(`Seeded ${result.insertedCount} conversations.`);

  return {
    insertedCount: result.insertedCount,
    schoolId: school._id,
  };
}
