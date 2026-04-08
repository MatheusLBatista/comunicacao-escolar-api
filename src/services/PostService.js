import PostRepository from '../repositories/PostRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import ClassRepository from '../repositories/ClassRepository.js';

import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';
class PostService {
  constructor() {
    this.repository = new PostRepository();
    this.schoolRepository = new SchoolRepository();
    this.classRepository = new ClassRepository();
  }

  async list(req) {
    const data = await this.repository.list(req);

    return data;
  }

  async create(parsedData) {
    const school = await this.schoolRepository.findById(parsedData.school_id);

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
      const data = await this.repository.create(parsedData);
      return data;
    }

    const data = await this.repository.create(parsedData);

    // TODO: EMITIR EVENTO WEBSOCKET ANNOUNCEMENT:CREATED AO CRIAR UM NOVO ANÙNCIO
    return data;
  }
}
export default PostService;
