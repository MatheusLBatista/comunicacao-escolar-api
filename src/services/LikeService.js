import LikeRepository from "../repositories/LikeRepository.js";
import PostRepository from "../repositories/PostRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import CustomError from "../utils/helpers/CustomError.js";
import HttpStatusCodes from "../utils/helpers/HttpStatusCodes.js";

class LikeService {
    constructor() {
        this.repository = new LikeRepository();
        this.postRepository = new PostRepository();
        this.userRepository = new UserRepository();
    }

    async toggleLike(userId, postId) {

        const post = await this.postRepository.getById(postId)

        if (!post || post.active == false) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'post',
                details: [
                    {
                        path: 'post',
                        message: 'O id de post informado não foi encontrado.'
                    }
                ],
                customMessage: 'post não foi encontrado ou está desativado.'
            })
        }

        const user = await this.userRepository.getById(userId)

        if (user.memberships.some((user) => user.role === "admin")) {

            const data = await this.repository.toglleLike(userId, postId);

            return data;
        }

        if (!user.memberships.some((user) => user.school_id.toJSON() == post.school_id.toJSON())) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'forbidden',
                field: 'like',
                details: [
                    {
                        path: 'like',
                        message: 'Usuário não pode dar like em posts de escolas diferentes ao qual ele pertence.'
                    }
                ],
                customMessage: 'Não é possivel dar like em escolas diferentes.'
            })
        }

        if (post.target.scope === "all") {

            const data = await this.repository.toglleLike(userId, postId)

            return data
        }


        if (user.memberships.some((user) => user.role === "teacher")) {

            const data = await this.repository.toglleLike(userId, postId)

            return data
        }

        const classExists = user.memberships.some(async(member) => {
            member.associated_students.some(async (studant) => {
                const studantInfo = await this.userRepository.getById(studant)
                return studantInfo.memberships.some((turma) => turma.class_id === post.target.target_id)
            })
        })
        if (!classExists) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'forbidden',
                field: 'like',
                details: [
                    {
                        path: 'like',
                        message: 'Usuário não pode dar like em post de turma/classe diferentes.'
                    }
                ],
                customMessage: 'Não é possivel dar like em post cujo o scope seja diferente de "all" e a turma não seja a mesma do usuário.'
            })
        }

        const data = await this.repository.toglleLike(userId, postId)

        return data

    }
}
export default LikeService;