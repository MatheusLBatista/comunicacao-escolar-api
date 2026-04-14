import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import DailyLog from '../models/DailyLog.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const ACTIONS = ['view', 'download', 'export'];
const RESOURCE_TYPES = [
  'daily_log',
  'announcement',
  'message',
  'conversation',
  'incident',
  'event',
  'pickup_log',
  'student_profile',
];
const PLATFORMS = ['ios', 'android', 'web'];

export default async function auditLogSeed(schools, users) {
  await AuditLog.deleteMany({});

  const logsPerSchool = Number(process.env.AUDIT_LOGS_PER_SCHOOL) || 10;
  const schoolIds = extractSchoolIds(schools, users);

  if (schoolIds.length === 0) {
    console.log(
      'Nenhuma escola válida encontrada para criação de audit logs.',
    );
    return { insertedCount: 0, auditLogs: [] };
  }

  const allUsers = await User.find({
    memberships: {
      $elemMatch: {
        school_id: { $in: schoolIds },
        role: { $in: ['admin', 'teacher', 'parent'] },
      },
    },
    active: true,
  })
    .select('_id memberships')
    .lean();

  const students = await User.find({
    memberships: {
      $elemMatch: {
        school_id: { $in: schoolIds },
        role: 'student',
      },
    },
    active: true,
  })
    .select('_id memberships')
    .lean();

  const events = await Event.find({
    school_id: { $in: schoolIds },
    active: true,
  })
    .select('_id school_id title')
    .lean();

  const dailyLogs = await DailyLog.find({
    school_id: { $in: schoolIds },
    active: true,
  })
    .select('_id school_id student_id')
    .lean();

  const conversations = await Conversation.find({
    school_id: { $in: schoolIds },
    active: true,
  })
    .select('_id school_id')
    .lean();

  const auditLogs = [];

  for (const schoolId of schoolIds) {
    const usersInSchool = allUsers.filter((user) =>
      user.memberships?.some(
        (m) =>
          String(m.school_id) === String(schoolId) &&
          ['admin', 'teacher', 'parent'].includes(m.role),
      ),
    );

    const studentsInSchool = students.filter((s) =>
      s.memberships?.some(
        (m) => String(m.school_id) === String(schoolId) && m.role === 'student',
      ),
    );

    const eventsInSchool = events.filter(
      (e) => String(e.school_id) === String(schoolId),
    );

    const dailyLogsInSchool = dailyLogs.filter(
      (d) => String(d.school_id) === String(schoolId),
    );

    const conversationsInSchool = conversations.filter(
      (c) => String(c.school_id) === String(schoolId),
    );

    if (usersInSchool.length === 0) {
      continue;
    }

    for (let i = 0; i < logsPerSchool; i++) {
      const user = randomItem(usersInSchool);
      const membership = user.memberships.find(
        (m) =>
          String(m.school_id) === String(schoolId) &&
          ['admin', 'teacher', 'parent'].includes(m.role),
      );

      const resourceType = randomItem(RESOURCE_TYPES);
      const resourceData = pickResource(
        resourceType,
        eventsInSchool,
        dailyLogsInSchool,
        conversationsInSchool,
        studentsInSchool,
      );

      const studentId = pickStudentId(
        resourceType,
        resourceData,
        dailyLogsInSchool,
        studentsInSchool,
      );

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
      createdAt.setHours(
        Math.floor(Math.random() * 14) + 7,
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60),
      );

      auditLogs.push({
        school_id: schoolId,
        user_id: user._id,
        user_role: membership.role,
        action: randomItem(ACTIONS),
        resource_type: resourceType,
        resource_id: resourceData.id,
        resource_summary: resourceData.summary,
        student_id: studentId,
        ip_address: generateIp(),
        user_agent: generateUserAgent(),
        device_info: {
          platform: randomItem(PLATFORMS),
          app_version: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
          os_version: `${Math.floor(Math.random() * 5) + 13}.${Math.floor(Math.random() * 6)}`,
        },
        session_id: generateSessionId(),
        metadata: { page: 1 },
        created_at: createdAt,
      });
    }
  }

  if (auditLogs.length === 0) {
    console.log('Nenhum audit log foi criado.');
    return { insertedCount: 0, auditLogs: [] };
  }

  const result = await AuditLog.collection.insertMany(auditLogs);

  console.log(`Seeded ${result.insertedCount} audit logs.`);

  return { insertedCount: result.insertedCount, auditLogs };
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function pickResource(
  resourceType,
  events,
  dailyLogs,
  conversations,
  students,
) {
  const fakeId = new mongoose.Types.ObjectId();

  switch (resourceType) {
    case 'event':
      if (events.length > 0) {
        const event = randomItem(events);
        return { id: event._id, summary: `Evento: ${event.title}` };
      }
      return { id: fakeId, summary: 'Evento escolar' };

    case 'daily_log':
      if (dailyLogs.length > 0) {
        const dl = randomItem(dailyLogs);
        return { id: dl._id, summary: 'Comunicado diário' };
      }
      return { id: fakeId, summary: 'Comunicado diário' };

    case 'conversation':
      if (conversations.length > 0) {
        const conv = randomItem(conversations);
        return { id: conv._id, summary: 'Conversa' };
      }
      return { id: fakeId, summary: 'Conversa' };

    case 'student_profile':
      if (students.length > 0) {
        const student = randomItem(students);
        return { id: student._id, summary: 'Perfil do aluno' };
      }
      return { id: fakeId, summary: 'Perfil do aluno' };

    default:
      return { id: fakeId, summary: `Acesso a ${resourceType}` };
  }
}

function await_objectId() {
  const mongoose = await_mongoose();
  return mongoose.Types.ObjectId;
}

function await_mongoose() {
  // Use dynamic import workaround - but we already have mongoose IDs from DB
  // For seeds, we'll use a simpler approach
  return { Types: { ObjectId: function() { return new (require('mongoose')).Types.ObjectId(); } } };
}

function pickStudentId(resourceType, resourceData, dailyLogs, students) {
  const studentRelated = [
    'daily_log',
    'incident',
    'pickup_log',
    'student_profile',
  ];

  if (!studentRelated.includes(resourceType)) {
    return null;
  }

  if (resourceType === 'student_profile' && resourceData?.id) {
    return resourceData.id;
  }

  if (resourceType === 'daily_log') {
    const dl = dailyLogs.find(
      (d) => String(d._id) === String(resourceData.id),
    );
    if (dl?.student_id) return dl.student_id;
  }

  if (students.length > 0) {
    return randomItem(students)._id;
  }

  return null;
}

function generateIp() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function generateUserAgent() {
  const agents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'ComunicaAlunos/1.2.0 (iOS 17.0)',
    'ComunicaAlunos/1.2.0 (Android 14)',
  ];
  return randomItem(agents);
}

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

  return [...new Set(ids.map(String))];
}
