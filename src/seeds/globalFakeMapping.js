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
  },

  School: {
    name: () => fakebr.company.companyName(),
    tax_id: () => fakebr.br.cnpj(),
    address: () => ({
      street: fakebr.address.streetAddress(),
      city: fakebr.address.city(),
      state: fakebr.address.state(),
      zip_code: fakebr.address.zipCode(),
    }),
    active: () => fakebr.random.boolean(),
  },

  Chat: {
    participants: () => [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ],
    type: () => fakebr.random.arrayElement(['private', 'daily_log_reply']),
    last_message_at: () => null,
  },

  DailyLog: {
    teacher_id: () => new mongoose.Types.ObjectId(),
    is_present: () => fakebr.random.boolean(),
    entries: () => [
      {
        field_key: 'mood_status',
        value: fakebr.random.arrayElement(['happy', 'neutral', 'sad']),
      },
    ],
    attachments: () => [],
    read_at: () => null,
    date: () => new Date().toISOString(),
  },

  DailyLogTemplate: {
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
    texto: () => fakebr.lorem.sentence(),
    read_by: () => [],
    sent_at: () => new Date().toISOString(),
  },

  Post: {
    author_id: () => new mongoose.Types.ObjectId(),
    titulo: () => fakebr.lorem.sentence(),
    conteudo: () => fakebr.lorem.paragraphs(2),
    target: () => ({
      scope: 'all',
      target_id: null,
    }),
    attachments: () => [],
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
