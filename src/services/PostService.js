import PostRepository from '../repositories/PostRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import ClassRepository from '../repositories/ClassRepository.js';
import UserRepository from '../repositories/UserRepository.js';

import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';
import compress from '../config/SharpConfig.js';
import mongoose from 'mongoose';
import minioClient from '../config/MinIO.js';

class PostService {
  constructor() {
    this.repository = new PostRepository();
    this.schoolRepository = new SchoolRepository();
    this.classRepository = new ClassRepository();
    this.userRepository = new UserRepository();
  }

  async list(req) {
    const data = await this.repository.list(req);

    return data;
  }

  async create(parsedData, userId, schoolId) {
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

    if (targetScope !== 'all') {
      if (
        parsedData.target?.target_id == null ||
        parsedData.target?.target_id == ''
      ) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'unprocessableEntity',
          field: 'anuncio',
          details: [
            {
              path: 'anuncio',
              message:
                'O anuncio não possui o target_id exigido quando o scope é diferente de "all"',
            },
          ],
          customMessage: 'target_id não é válido ou está ausente.',
        });
      }

      const turma = await this.classRepository.findById(
        parsedData.target.target_id,
      );

      if (!turma) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'unprocessableEntity',
          field: 'class',
          details: [
            {
              path: 'class',
              message: 'O id da class/turma informado não foi encontrado.',
            },
          ],
          customMessage: 'class_id não foi encontrado.',
        });
      }
      const data = await this.repository.create({ ...parsedData, author_id: userId, school_id: schoolId })
      return data

    }

    const data = await this.repository.create({ ...parsedData, author_id: userId, school_id: schoolId });


    // TODO: EMITIR EVENTO WEBSOCKET ANNOUNCEMENT:CREATED AO CRIAR UM NOVO ANÙNCIO
    return data;
  }

  async update(id, parsedData, userId) {
    const user = await this.userRepository.getById(userId);


    const clearParsed = await this.verifyRelation(id, parsedData)

    if (user.memberships.some(user => user.role === "admin")) {

      const data = await this.repository.update(id, clearParsed)


      return data;
    }

    const data = await this.repository.update(id, clearParsed, userId)


    return data;
  }


  async delete(id, userId) {

    const user = await this.userRepository.getById(userId)

    if (user.memberships.some(user => user.role === "admin")) {

      await this.repository.delete(id)

      return
    }

    await this.repository.delete(id, userId)

    return
  }

  async verifyRelation(id, parsedData) {

    if (parsedData.target?.scope && parsedData.target.scope != "all") {

      if (!parsedData.target.target_id) {
        throw new CustomError({
          statusCode: HttpStatusCodes.BAD_REQUEST.code,
          errorType: 'badRequest',
          field: 'class',
          details: [
            {
              path: 'class',
              message: 'O id da class/turma informado não foi encontrado.',
            },
          ],
          customMessage: 'class_id/target_id não foi encontrado.',
        })
      }

      const turma = await this.classRepository.findById(parsedData.target.target_id)
      const post = await this.repository.getById(id)
      if (!turma) {
        throw new CustomError({
          statusCode: HttpStatusCodes.NOT_FOUND.code,
          errorType: 'notFound',
          field: 'class',
          details: [
            {
              path: 'class',
              message: 'O id da class/turma informado não foi encontrado.',
            },
          ],
          customMessage: 'class_id/target_id não foi encontrado.',
        })
      }

      if (post.school_id !== turma.school_id) {
        throw new CustomError({
          statusCode: HttpStatusCodes.CONFLICT.code,
          errorType: 'conflictError',
          field: 'class',
          details: [
            {
              path: 'class',
              message: 'A turma selecionada pertence a uma escola diferente do anúncio.',
            },
          ],
          customMessage: 'Não é possível vincular o anúncio a uma turma de outra escola.',
        });
      }
      return parsedData
    }

    if (parsedData.target) {
      delete parsedData.target
    }

    return parsedData
  }

  async uploadFoto(req, id) {

    const files = req.files;

    if (files.length == 0) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: "badRequest",
        field: "Foto",
        details: [{ path: "Foto", message: "Nenhum arquivo foi enviado ou o arquivo está vazio." }],
        customMessage: "Nenhum arquivo foi enviado ou o arquivo está vazio."
      })
    }

    files.forEach((file) => {
      if (file.size > (10 * 1024 * 1024)) {
        throw new CustomError({
          statusCode: HttpStatusCodes.PAYLOAD_TOO_LARGE.code,
          errorType: 'payloadTooLarge',
          field: "Imagem",
          details: [{ path: "Imagem", message: "Arquivo é superior a 10 MB" }],
          customMessage: "O arquivo é maior do que 10 MB."
        });
      }

    })

    const post = await this.repository.getById(id)
    if (!post) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: "post",
        details: [{ path: "post", message: "anuncio não encontrado." }],
        customMessage: "post não encontrado."
      });
    }

   files.forEach(async (file) => {

    const image = await compress(file.buffer)

    const obj = new mongoose.Types.ObjectId()

    const objectName =`${obj.toString()}.${image[1]}`

    let urlMinio = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIIO_BUCKET}/${objectName}` 

    const data = await this.repository.uploadFoto(id, urlMinio)

    try {
    await minioClient.putObject(process.env.MINIIO_BUCKET, objectName, image[0], {
      'Content-Type':file.mimetype,
    })

    return data

    } catch(error) {
      
      throw new Error(error)
    }

   })

  }

}

export default PostService;
