import PostRepository from '../repositories/PostRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import ClassRepository from '../repositories/ClassRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { firebaseMessaging } from '../config/Firebase.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';
import compress from '../config/SharpConfig.js';
import mongoose from 'mongoose';
import minioClient from '../config/MinIO.js';
import 'dotenv/config';
import User from '../models/User.js';

class PostService {
  constructor() {
    this.repository = new PostRepository();
    this.schoolRepository = new SchoolRepository();
    this.classRepository = new ClassRepository();
    this.userRepository = new UserRepository();
  }

  async list(req) {
    const userId = req?.user_id || req?.user?.id;
    const schoolId = req?.params?.schoolId;

    if (userId && schoolId && !req?.params?.id) {
      const user = await this.userRepository.getById(userId);
      const parentMembership = user?.memberships?.find(
        (m) => m.school_id?.toString() === schoolId.toString() && m.role === 'parent',
      );

      if (parentMembership) {
        const studentIds = parentMembership.associated_students ?? [];
        const classIds = [];

        for (const studentId of studentIds) {
          try {
            const student = await this.userRepository.getById(studentId.toString());
            const studentMembership = student?.memberships?.find(
              (m) => m.school_id?.toString() === schoolId.toString() && m.role === 'student',
            );
            if (studentMembership?.class_id) {
              classIds.push(studentMembership.class_id);
            }
          } catch {
            // aluno não encontrado, ignora
          }
        }

        req._parentClassIds = classIds;
      }
    }

    const data = await this.repository.list(req);

    if (req?.params?.id && data?.school_id) {
      const userId = req?.user_id || req?.user?.id;
      if (userId) {
        const user = await this.userRepository.getById(userId);
        const belongsToSchool =
          Array.isArray(user?.memberships) &&
          user.memberships.some(
            (m) => m?.school_id?.toString() === data.school_id.toString(),
          );

        if (!belongsToSchool) {
          throw new CustomError({
            statusCode: HttpStatusCodes.FORBIDDEN.code,
            errorType: 'forbidden',
            field: 'post',
            details: [],
            customMessage: 'Você não tem acesso a este anúncio.',
          });
        }
      }
    }

    return data;
  }

  async create(parsedData, userId, schoolId, waitAttachments = false) {
    const school = await this.schoolRepository.findById(schoolId);

    if (!school) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'school',
        details: [
          { path: 'school', message: 'O id da escola não existe no banco.' },
        ],
        customMessage: 'school_id não foi encontrado.',
      });
    }

    const targetScope = parsedData.target?.scope ?? 'all';

    await this._assertTeacherClassPermission(
      userId,
      schoolId,
      targetScope,
      parsedData.target?.target_ids ?? [],
    );

    if (targetScope !== 'all') {
      const targetIds = parsedData.target?.target_ids ?? [];

      if (!targetIds.length) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'unprocessableEntity',
          field: 'anuncio',
          details: [
            {
              path: 'anuncio',
              message: 'O anuncio não possui target_ids quando o scope é "class"',
            },
          ],
          customMessage: 'target_ids não é válido ou está ausente.',
        });
      }

      const turmas = await Promise.all(
        targetIds.map((id) => this.classRepository.findById(id)),
      );

      const missingTurma = turmas.find((t) => !t);
      if (missingTurma !== undefined && !turmas.every(Boolean)) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'unprocessableEntity',
          field: 'class',
          details: [{ path: 'class', message: 'Uma ou mais turmas não foram encontradas.' }],
          customMessage: 'Um ou mais class_ids não foram encontrados.',
        });
      }

      const data = await this.repository.create({
        ...parsedData,
        author_id: userId,
        school_id: schoolId,
      });

      if (!waitAttachments) {
        const usersArrays = await Promise.all(
          targetIds.map((id) => this.userRepository.listByClass(id)),
        );
        const users = usersArrays.flat();
        const turmaNames = turmas.map((t) => t.name).join(', ');
        await this._notifyUsers(users, parsedData, data, turmaNames);
      }

      return data;
    }

    const data = await this.repository.create({
      ...parsedData,
      author_id: userId,
      school_id: schoolId,
    });

    if (!waitAttachments) {
      // Busca usuários sem limitação estrita de paginação para notificação
      const usersResult = await this.userRepository.listBySchool(schoolId, {
        limit: 1000,
      });
      const users = usersResult?.docs || [];

      await this._notifyUsers(users, parsedData, data);
    }

    return data;
  }

  async _notifyUsers(users, parsedData, postData, className = null) {
    const fcmTokens = [];

    if (users && Array.isArray(users)) {
      for (const doc of users) {
        if (doc.fcm_tokens && Array.isArray(doc.fcm_tokens)) {
          doc.fcm_tokens.forEach((token) => {
            if (token) fcmTokens.push(token);
          });
        }
      }
    }

    if (fcmTokens.length === 0) return;

    const title = className ? 'Novo Anúncio na sua Turma' : 'Novo Anúncio';
    const body =
      parsedData.title ||
      (className
        ? `Um novo anúncio foi publicado para a turma ${className}`
        : 'Um novo anúncio foi publicado na sua escola');

    const message = {
      tokens: [...new Set(fcmTokens)], // Remove duplicatas
      notification: {
        title: title,
        body: body,
      },
      data: {
        type: 'announcement',
        postId: postData._id.toString(),
      },
    };

    try {
      const response = await firebaseMessaging.sendEachForMulticast(message);
      console.log(
        `Notificações enviadas: ${response.successCount}, Falhadas: ${response.failureCount}`,
      );

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Token falhou: ${message.tokens[idx]} - ${resp.error?.message}`);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao enviar notificação Firebase:', error);
    }
  }

  async _assertTeacherClassPermission(userId, schoolId, scope, targetIds) {
    const user = await this.userRepository.getById(userId);
    const membership = user?.memberships?.find(
      (m) => m.school_id?.toString() === schoolId?.toString() && m.active !== false,
    );

    if (!membership || membership.role !== 'teacher') return;

    if (scope === 'all') {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'target',
        details: [],
        customMessage: 'Professores só podem publicar para suas próprias turmas.',
      });
    }

    const teacherClasses = await this.classRepository.findByTeacher(userId, schoolId);
    const teacherClassIds = new Set(teacherClasses.map((c) => c._id.toString()));

    const unauthorized = targetIds.find((id) => !teacherClassIds.has(id.toString()));
    if (unauthorized) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'target.target_ids',
        details: [],
        customMessage: 'Professores só podem publicar para turmas às quais pertencem.',
      });
    }
  }

  async update(id, parsedData, userId) {
    const user = await this.userRepository.getById(userId);

    const clearParsed = await this.verifyRelation(id, parsedData);

    if (user.memberships.some((user) => user.role === 'admin')) {
      const data = await this.repository.update(id, clearParsed);

      return data;
    }

    const data = await this.repository.update(id, clearParsed, userId);

    return data;
  }

  async delete(id, userId) {
    const user = await this.userRepository.getById(userId);
    const post = await this.repository.getById(id);

    if (user.memberships.some((user) => user.role === 'admin')) {
      await this.repository.delete(id);
    } else {
      await this.repository.delete(id, userId);
    }

    // Notifica os usuários sobre a deleção (Silencioso)
    try {
      let users = [];
      if (post.target?.scope === 'class' && post.target?.target_ids?.length) {
        const usersArrays = await Promise.all(
          post.target.target_ids.map((id) => this.userRepository.listByClass(id)),
        );
        users = usersArrays.flat();
      } else {
        const result = await this.userRepository.listBySchool(post.school_id, {
          limit: 1000,
        });
        users = result?.docs || [];
      }
      await this._notifyPostDeletion(users, id);
    } catch (error) {
      console.error('Erro ao notificar deleção de post:', error);
    }

    return;
  }

  async _notifyPostDeletion(users, postId) {
    const fcmTokens = [];
    if (users && Array.isArray(users)) {
      for (const doc of users) {
        if (doc.fcm_tokens && Array.isArray(doc.fcm_tokens)) {
          doc.fcm_tokens.forEach((token) => {
            if (token) fcmTokens.push(token);
          });
        }
      }
    }

    if (fcmTokens.length === 0) return;

    const message = {
      tokens: [...new Set(fcmTokens)],
      // Notificação silenciosa: SEM o campo 'notification', apenas 'data'
      data: {
        type: 'delete_post',
        postId: postId.toString(),
      },
    };

    try {
      await firebaseMessaging.sendEachForMulticast(message);
    } catch (error) {
      console.error('Erro ao enviar notificação de deleção Firebase:', error);
    }
  }

  async verifyRelation(id, parsedData) {
    if (parsedData.target?.scope && parsedData.target.scope !== 'all') {
      const targetIds = parsedData.target?.target_ids ?? [];

      if (!targetIds.length) {
        throw new CustomError({
          statusCode: HttpStatusCodes.BAD_REQUEST.code,
          errorType: 'badRequest',
          field: 'class',
          details: [{ path: 'class', message: 'target_ids ausente ou vazio para scope "class".' }],
          customMessage: 'target_ids não foi encontrado.',
        });
      }

      const post = await this.repository.getById(id);
      const turmas = await Promise.all(
        targetIds.map((tid) => this.classRepository.findById(tid)),
      );

      for (const turma of turmas) {
        if (!turma) {
          throw new CustomError({
            statusCode: HttpStatusCodes.NOT_FOUND.code,
            errorType: 'notFound',
            field: 'class',
            details: [{ path: 'class', message: 'Uma ou mais turmas não foram encontradas.' }],
            customMessage: 'Um ou mais class_ids não foram encontrados.',
          });
        }
        if (post.school_id?.toString() !== turma.school_id?.toString()) {
          throw new CustomError({
            statusCode: HttpStatusCodes.CONFLICT.code,
            errorType: 'conflictError',
            field: 'class',
            details: [{ path: 'class', message: 'Turma pertence a outra escola.' }],
            customMessage: 'Não é possível vincular o anúncio a uma turma de outra escola.',
          });
        }
      }

      return parsedData;
    }

    if (parsedData.target) {
      delete parsedData.target;
    }

    return parsedData;
  }

  async uploadFoto(req, id, notify = false) {
    const userId = req.user_id;

    const files = req.files;
    if (!files) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'badRequest',
        field: 'Foto',
        details: [
          {
            path: 'Foto',
            message: 'Nenhum arquivo foi enviado ou o arquivo está vazio.',
          },
        ],
        customMessage: 'Nenhum arquivo foi enviado ou o arquivo está vazio.',
      });
    }

    if (files.length == 0) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'badRequest',
        field: 'Foto',
        details: [
          {
            path: 'Foto',
            message: 'Nenhum arquivo foi enviado ou o arquivo está vazio.',
          },
        ],
        customMessage: 'Nenhum arquivo foi enviado ou o arquivo está vazio.',
      });
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new CustomError({
          statusCode: HttpStatusCodes.PAYLOAD_TOO_LARGE.code,
          errorType: 'payloadTooLarge',
          field: 'Imagem',
          details: [{ path: 'Imagem', message: 'Arquivo é superior a 10 MB' }],
          customMessage: 'O arquivo é maior do que 10 MB.',
        });
      }
    }

    const post = await this.repository.getById(id);
    if (!post) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'post',
        details: [{ path: 'post', message: 'anuncio não encontrado.' }],
        customMessage: 'post não encontrado.',
      });
    }

    const uploaderUser = await this.userRepository.getById(userId);
    const isAdmin = uploaderUser?.memberships?.some((m) => m.role === 'admin');

    for (const file of files) {
      const image = await compress(file.buffer);

      const obj = new mongoose.Types.ObjectId().toString();

      const objectName = `${obj.toString()}.${image[1].format}`;

      // let urlMinio = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${objectName}`

      await this.repository.uploadFoto(id, objectName, isAdmin ? null : userId);

      try {
        await minioClient.putObject(
          process.env.MINIO_BUCKET,
          objectName,
          image[0],
          {
            'Content-Type': file.mimetype,
          },
        );
      } catch (error) {
        await this.repository.deletaFoto(id, objectName, userId);
        throw new Error(error);
      }
    }
    const data = await this.repository.getById(id);

    if (notify) {
      const targetScope = data.target?.scope ?? 'all';
      const targetIds = data.target?.target_ids ?? [];
      if (targetScope !== 'all' && targetIds.length) {
        const turmas = await Promise.all(
          targetIds.map((id) => this.classRepository.findById(id)),
        );
        const usersArrays = await Promise.all(
          targetIds.map((id) => this.userRepository.listByClass(id)),
        );
        const users = usersArrays.flat();
        const turmaNames = turmas.map((t) => t?.name).filter(Boolean).join(', ');
        await this._notifyUsers(users, data, data, turmaNames);
      } else {
        const usersResult = await this.userRepository.listBySchool(
          data.school_id,
          { limit: 1000 },
        );
        const users = usersResult?.docs || [];
        await this._notifyUsers(users, data, data);
      }
    }

    return data;
  }

  async getFoto(id) {
    try {
      const foto = await minioClient.getObject(process.env.MINIO_BUCKET, id);

      const data = await this.constructorBuffer(foto);

      return { buffer: data, content_type: foto.headers['content-type'] };
    } catch (error) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'attachments',
        details: [{ path: 'attachments', message: 'Foto não encontrada' }],
        customMessage: `Nenhuma foto com o ${id} encontrada`,
      });
    }
  }

  // Constrói o buffer da imagem
  async constructorBuffer(foto) {
    const chunks = [];
    const imagem = new Promise((resolve, reject) => {
      try {
        foto.on('data', (chunk) => {
          chunks.push(chunk);
        });
        foto.on('end', () => {
          const imagemBuffer = Buffer.concat(chunks);
          resolve(imagemBuffer);
        });
      } catch (err) {
        reject(err);
      }
    });

    return await imagem;
  }

  async deleteFoto(req, postId, linkId) {
    const userId = req.user_id;

    const post = await this.repository.getById(postId);

    if (!post || post.active === false) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'post',
        details: [{ path: 'post', message: 'Anuncio nao encontrado.' }],
        customMessage: 'Anuncio nao encontrado.',
      });
    }

    const user = await this.userRepository.getById(userId);
    const isAdmin = user?.memberships?.some(
      (membership) => membership.role === 'admin',
    );

    if (!isAdmin) {
      const isOwner = post.author_id?.toString() === userId?.toString();
      if (!isOwner) {
        throw new CustomError({
          statusCode: HttpStatusCodes.FORBIDDEN.code,
          errorType: 'forbidden',
          field: 'post',
          details: [
            { path: 'post', message: 'Permissao negada para remover anexo.' },
          ],
          customMessage: 'Permissao negada para remover anexo.',
        });
      }
    }

    const foto = await this.repository.getFoto({
      postId,
      linkId,
      userId: isAdmin ? null : userId,
    });

    if (!foto) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'attachments',
        details: [{ path: 'attachments', message: 'Foto nao encontrada.' }],
        customMessage: 'Foto nao encontrada.',
      });
    }

    await this.repository.deletaFoto(postId, linkId, isAdmin ? null : userId);

    return { message: 'Foto removida com sucesso.' };
  }
}

export default PostService;
