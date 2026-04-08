import Post from '../models/Post.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';
import { fakeMappings } from './globalFakeMapping.js';

export default async function postSeed(schools, users) {
  await Post.deleteMany({});

  const allowedRoles = ['admin', 'teacher'];
  const postsPerSchool = Number(process.env.POSTS_PER_SCHOOL) || 3;

  const schoolIds = extractSchoolIds(schools, users);
  const candidateUserIds = extractCandidateUserIds(users);

  if (schoolIds.length === 0) {
    console.log('Nenhuma escola válida encontrada para criação de anúncios.');
    return { insertedCount: 0, posts: [] };
  }

  const userQuery = {
    memberships: {
      $elemMatch: {
        school_id: { $in: schoolIds },
        role: { $in: allowedRoles },
      },
    },
  };

  if (candidateUserIds.length > 0) {
    userQuery._id = { $in: candidateUserIds };
  }

  const eligibleUsers = await User.find(userQuery)
    .select('_id memberships')
    .lean();

  const classes = await Class.find({
    school_id: { $in: schoolIds },
    active: true,
  })
    .select('_id school_id')
    .lean();

  const classIdsBySchool = new Map();

  for (const turma of classes) {
    const schoolKey = String(turma.school_id);

    if (!classIdsBySchool.has(schoolKey)) {
      classIdsBySchool.set(schoolKey, []);
    }

    classIdsBySchool.get(schoolKey).push(turma._id);
  }

  const posts = [];

  for (const schoolId of schoolIds) {
    const creatorsInSchool = eligibleUsers.filter((user) =>
      user.memberships?.some(
        (membership) =>
          String(membership.school_id) === String(schoolId) &&
          allowedRoles.includes(membership.role),
      ),
    );

    if (creatorsInSchool.length === 0) {
      continue;
    }

    const classIds = classIdsBySchool.get(String(schoolId)) || [];

    for (let index = 0; index < postsPerSchool; index++) {
      const author =
        creatorsInSchool[Math.floor(Math.random() * creatorsInSchool.length)];

      const target = buildPostTarget(classIds);

      posts.push({
        school_id: schoolId,
        author_id: author._id,
        title: fakeMappings.Post.title(),
        content: fakeMappings.Post.content(),
        target,
        attachments: fakeMappings.Post.attachments(),
        active: true,
      });
    }
  }

  if (posts.length === 0) {
    console.log(
      'Nenhum anúncio foi criado: não há usuários com papel admin/teacher nas escolas recebidas.',
    );
    return { insertedCount: 0, posts: [] };
  }

  const result = await Post.collection.insertMany(posts);

  console.log(`Seeded ${result.insertedCount} posts.`);

  return { insertedCount: result.insertedCount, posts };
}

function extractSchoolIds(schools, users) {
  const ids = [];

  if (Array.isArray(schools)) {
    ids.push(...schools.map((school) => school?._id).filter(Boolean));
  }

  if (schools?.result?.insertedIds) {
    ids.push(...Object.values(schools.result.insertedIds));
  }

  if (schools?.schools && Array.isArray(schools.schools)) {
    ids.push(...schools.schools.map((school) => school?._id).filter(Boolean));
  }

  if (schools?.schoolId) {
    ids.push(schools.schoolId);
  }

  if (users?.schoolId) {
    ids.push(users.schoolId);
  }

  return normalizeObjectIds(ids);
}

function extractCandidateUserIds(users) {
  const ids = [];

  if (Array.isArray(users)) {
    ids.push(...users.map((user) => user?._id).filter(Boolean));
  }

  if (users?.users?.insertedIds) {
    ids.push(...Object.values(users.users.insertedIds));
  }

  if (users?.adminId) {
    ids.push(users.adminId);
  }

  return normalizeObjectIds(ids);
}

function normalizeObjectIds(ids) {
  const normalized = ids
    .map((id) => {
      if (!id) {
        return null;
      }

      if (id instanceof mongoose.Types.ObjectId) {
        return id;
      }

      const asString = String(id);

      if (mongoose.Types.ObjectId.isValid(asString)) {
        return new mongoose.Types.ObjectId(asString);
      }

      return null;
    })
    .filter(Boolean);

  return Array.from(
    new Map(normalized.map((id) => [id.toString(), id])).values(),
  );
}

function buildPostTarget(classIds) {
  if (!classIds.length) {
    return {
      scope: 'all',
      target_id: null,
    };
  }

  const useClassScope = Math.random() >= 0.5;

  if (!useClassScope) {
    return {
      scope: 'all',
      target_id: null,
    };
  }

  return {
    scope: 'class',
    target_id: classIds[Math.floor(Math.random() * classIds.length)],
  };
}
