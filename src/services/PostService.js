import PostRepository from "../repositories/PostRepository.js"
import SchoolRepository from "../repositories/SchoolRepository.js";

import {
    CustomError,
    HttpStatusCodes,
    messages,
} from '../utils/helpers/index.js';
class PostService {
    constructor() {
        this.repository = new PostRepository()
        this.schoolRepository = new SchoolRepository()
    }
    async createPost(parsedData) {
        const school = await this.schoolRepository.findById(parsedData.school_id)

        if (!school) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'school',
                details: [{ path: 'school', message: 'O id da escola não existe no banco.' }],
                customMessage: 'school_id não foi encontrado.',
            })
        }

        const targetScope = parsedData.target?.scope ?? "all"

        if (targetScope !== "all") {
            if (parsedData.target?.target_id == null || parsedData.target?.target_id == "") {
                throw new CustomError({
                    statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
                    errorType: 'unprocessableEntity',
                    field: 'anuncio',
                    details: [{ path: 'anuncio', message: 'O anuncio não possui o target_id exigido quando o scope é diferente de "all"' }],
                    customMessage: 'target_id não é válido ou está ausente.',
                })
            }
        }
        
        const data = await this.repository.createModel(parsedData)

        // TODO: EMITIR EVENTO WEBSOCKET ANNOUNCEMENT:CREATED AO CRIAR UM NOVO ANÙNCIO
        return data
    }
}
export default PostService