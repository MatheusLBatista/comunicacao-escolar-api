import fakebr from 'faker-br';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import loadModels from './loadModels.js';
import TokenUtil from '../utils/TokenUtil.js';

export const fakeMappings = {
  common: {
    nome: () =>
      `${fakebr.name.firstName()} ${fakebr.name.lastName()} ${fakebr.name.lastName()}`,
    descricao: () => fakebr.lorem.sentence(),
    data_hora: () => new Date().toISOString(),
    rota: () => fakebr.lorem.word(10),
    dominio: () => fakebr.internet.url(),
    ativo: () => fakebr.random.boolean(),
    route: () => fakebr.lorem.word(10),
    domain: () => fakebr.internet.url(),
    active: () => fakebr.random.boolean(),
    get: () => fakebr.random.boolean(),
    post: () => fakebr.random.boolean(),
    put: () => fakebr.random.boolean(),
    patch: () => fakebr.random.boolean(),
    delete: () => fakebr.random.boolean(),
    permissions: () => [
      {
        route: fakebr.lorem.word(),
        domain: fakebr.internet.url(),
        active: fakebr.random.boolean(),
        get: fakebr.random.boolean(),
        post: fakebr.random.boolean(),
        put: fakebr.random.boolean(),
        patch: fakebr.random.boolean(),
        delete: fakebr.random.boolean(),
      },
    ],
    created_at: () => new Date().toISOString(),
    updated_at: () => new Date().toISOString(),
    school_id: () => new mongoose.Types.ObjectId(),
    student_id: () => new mongoose.Types.ObjectId(),
    user_id: () => new mongoose.Types.ObjectId(),
  },

  User: {
    full_name: () =>
      `${fakebr.name.firstName()} ${fakebr.name.lastName()} ${fakebr.name.lastName()}`,
    email: () => fakebr.internet.email(),
    password: () => fakebr.internet.password(),
    active: () => fakebr.random.boolean(),
    groups: () => [],
    permissions: () => [],
    fcm_tokens: () => [],
    avatar_url: () => null,
    memberships: () => [],
    class_id: () => new mongoose.Types.ObjectId(),
    unique_token: () =>
      TokenUtil.generateAccessToken(new mongoose.Types.ObjectId().toString()),
    refresh_token: () =>
      TokenUtil.generateRefreshToken(new mongoose.Types.ObjectId().toString()),
    access_token: () =>
      TokenUtil.generateAccessToken(new mongoose.Types.ObjectId().toString()),
    invite_token: () => uuid(),
    invited_at: () => null,
    activated_at: () => null,
    password_recovery_code: () => null,
    password_recovery_code_exp: () => null,
    google_id: () => null,
    auth_provider: () => 'local',
  },

  School: {
    name: () => fakebr.company.companyName(),
    tax_id: () => fakebr.br.cnpj(),
    address: () => ({
      street: fakebr.address.streetAddress(),
      number: fakebr.random.number({ min: 1, max: 1000 }).toString(),
      city: fakebr.address.city(),
      state: fakebr.address.state(),
      zip_code: fakebr.address.zipCode(),
    }),
    active: () => fakebr.random.boolean(),
  },

  Class: {
    name: () => `Turma ${fakebr.random.alphaNumeric(1).toUpperCase()}`,
    shift: () => fakebr.random.arrayElement(['Manhã', 'Tarde', 'Integral']),
    year: () => new Date().getFullYear(),
    teacher_ids: () => [new mongoose.Types.ObjectId()],
    metadata: () => fakebr.lorem.sentence(),
  },

  Conversation: {
    participants: () => [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ],
    type: () => fakebr.random.arrayElement(['private', 'daily_log_reply']),
    last_message_at: () => null,
  },

  DailyLog: {
    teacher_id: () => new mongoose.Types.ObjectId(),
    dailylogtemplate_id: () => new mongoose.Types.ObjectId(),
    is_present: () => fakebr.random.boolean(),
    entries: () => [
      {
        field_key: 'mood_status',
        value: fakebr.random.arrayElement(['happy', 'neutral', 'sad']),
      },
    ],
    attachments: () => [],
    observation: () => fakebr.lorem.sentence(),
    read_at: () => null,
    date: () => new Date().toISOString(),
  },

  DailyLogTemplate: {
    name: () => 'Diário de Bordo',
    fields: () => [
      {
        key: 'mood_status',
        label: 'Disposição',
        type: 'select',
        options: ['Feliz', 'Neutro', 'Triste'],
      },
    ],
  },

  Like: {
    post_id: () => new mongoose.Types.ObjectId(),
  },

  Message: {
    conversation_id: () => new mongoose.Types.ObjectId(),
    sender_id: () => new mongoose.Types.ObjectId(),
    text: () => fakebr.lorem.sentence(),
    read_by: () => [],
    sent_at: () => new Date().toISOString(),
  },

  Post: {
    author_id: () => new mongoose.Types.ObjectId(),
    title: () => fakebr.lorem.sentence(),
    content: () => fakebr.lorem.paragraphs(2),
    target: () => ({
      scope: 'all',
      target_id: null,
    }),
    attachments: () => [],
  },

  Event: {
    title: () => fakebr.lorem.sentence(),
    description: () => fakebr.lorem.paragraph(),
    type: () =>
      fakebr.random.arrayElement([
        'event',
        'meeting',
        'commemorative',
        'pedagogical',
      ]),
    start_date: () => new Date(),
    end_date: () => new Date(Date.now() + 60 * 60 * 1000),
    all_day: () => fakebr.random.boolean(),
    target: () => ({
      scope: fakebr.random.arrayElement(['all', 'class']),
    }),
    created_by: () => new mongoose.Types.ObjectId(),
    active: () => true,
  },

  PickupAuthorization: {
    authorized_by: () => new mongoose.Types.ObjectId(),
    authorized_person: {
      name: () => `${fakebr.name.firstName()} ${fakebr.name.lastName()}`,
      document: () =>
        fakebr.random.boolean() ? fakebr.br.cpf() : fakebr.br.rg(),
      relationship: () =>
        fakebr.random.arrayElement([
          'Avó',
          'Avô',
          'Tio',
          'Tia',
          'Padrinho',
          'Madrinha',
          'Irmão',
          'Irmã',
        ]),
    },
    qr_code: () => uuid(),
    valid_from: () => new Date(),
    valid_until: () =>
      new Date(
        Date.now() +
          1000 * 60 * 60 * 24 * fakebr.random.number({ min: 7, max: 90 }),
      ),
    used: () => false,
    active: () => true,
  },

  PickupLog: {
    authorization_id: () => new mongoose.Types.ObjectId(),
    picked_up_by: () => ({
      user_id: null,
      name: `${fakebr.name.firstName()} ${fakebr.name.lastName()}`,
      document: fakebr.random.boolean() ? fakebr.br.cpf() : fakebr.br.rg(),
    }),
    method: () => fakebr.random.arrayElement(['qr_code', 'manual']),
    departure_time: () => new Date(),
    verified_by: () => new mongoose.Types.ObjectId(),
    notes: () => fakebr.lorem.sentence(),
    active: () => true,
  },

  AuditLog: {
    user_role: () => fakebr.random.arrayElement(['admin', 'teacher', 'parent']),
    action: () => fakebr.random.arrayElement(['view', 'download', 'export']),
    resource_type: () =>
      fakebr.random.arrayElement([
        'daily_log',
        'announcement',
        'message',
        'conversation',
        'incident',
        'event',
        'pickup_log',
        'student_profile',
      ]),
    resource_id: () => new mongoose.Types.ObjectId(),
    resource_summary: () => fakebr.lorem.sentence(),
    ip_address: () => fakebr.internet.ip(),
    user_agent: () => fakebr.internet.userAgent(),
    device_info: () => ({
      platform: fakebr.random.arrayElement(['ios', 'android', 'web']),
      app_version: `1.${fakebr.random.number({ min: 0, max: 5 })}.${fakebr.random.number({ min: 0, max: 9 })}`,
      os_version: `${fakebr.random.number({ min: 13, max: 17 })}.${fakebr.random.number({ min: 0, max: 6 })}`,
    }),
    session_id: () => uuid(),
    metadata: () => ({ page: 1 }),
  },
};

// Retorna o mapping global, consolidando os mappings comuns e específicos.
// Nesta versão automatizada, carregamos os models e combinamos o mapping comum com o mapping específico de cada model.

export async function getGlobalFakeMapping() {
  const models = await loadModels();
  let globalMapping = { ...fakeMappings.common };

  models.forEach(({ name }) => {
    if (fakeMappings[name]) {
      globalMapping = {
        ...globalMapping,
        ...fakeMappings[name],
      };
    }
  });

  return globalMapping;
}

// Função auxiliar para extrair os nomes dos campos de um schema, considerando apenas os níveis superiores (campos aninhados são verificados pela parte antes do ponto).

function getSchemaFieldNames(schema) {
  const fieldNames = new Set();

  Object.keys(schema.paths).forEach((key) => {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return;
    const topLevel = key.split('.')[0];
    fieldNames.add(topLevel);
  });

  return Array.from(fieldNames);
}

// Valida se o mapping fornecido cobre todos os campos do model.
// Retorna um array com os nomes dos campos que estiverem faltando.

function validateModelMapping(model, modelName, mapping) {
  const fields = getSchemaFieldNames(model.schema);
  const missing = fields.filter((field) => !(field in mapping));

  if (missing.length > 0) {
    console.error(
      `Model ${modelName} está faltando mapeamento para os campos: ${missing.join(', ')}`,
    );
  } else {
    console.log(`Model ${modelName} possui mapeamento para todos os campos.`);
  }

  return missing;
}

// Executa a validação para os models fornecidos, utilizando o mapping específico de cada um.

async function validateAllMappings() {
  const models = await loadModels();
  const totalMissing = {};

  models.forEach(({ model, name }) => {
    // Combina os campos comuns com os específicos de cada model.
    const mapping = {
      ...fakeMappings.common,
      ...(fakeMappings[name] || {}),
    };
    const missing = validateModelMapping(model, name, mapping);
    if (missing.length > 0) {
      totalMissing[name] = missing;
    }
  });

  if (Object.keys(totalMissing).length === 0) {
    console.log('globalFakeMapping cobre todos os campos de todos os models.');
    return true;
  } else {
    console.warn('Faltam mapeamentos para os seguintes models:', totalMissing);
    return false;
  }
}

// Executa a validação antes de prosseguir com o seeding ou outras operações.

validateAllMappings()
  .then((valid) => {
    if (valid) {
      console.log('Podemos acessar globalFakeMapping com segurança.');
      // Prossegue com o seeding ou outras operações.
    } else {
      throw new Error(
        'globalFakeMapping não possui todos os mapeamentos necessários.',
      );
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export default getGlobalFakeMapping;
