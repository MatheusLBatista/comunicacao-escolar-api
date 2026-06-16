import LikeRepository from '../repositories/LikeRepository.js';
import PostRepository from '../repositories/PostRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import CustomError from '../utils/helpers/CustomError.js';
import HttpStatusCodes from '../utils/helpers/HttpStatusCodes.js';

class LikeService {
  constructor() {
    this.repository = new LikeRepository();
    this.postRepository = new PostRepository();
    this.userRepository = new UserRepository();
  }

  async toggleLike(userId, postId) {
    const post = await this.postRepository.getById(postId);

    if (!post || post.active == false) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'post',
        details: [
          {
            path: 'post',
            message: 'O id de post informado não foi encontrado.',
          },
        ],
        customMessage: 'post não foi encontrado ou está desativado.',
      });
    }

    const user = await this.userRepository.getById(userId);

    if (user.memberships.some((user) => user.role === 'admin')) {
      const data = await this.repository.toglleLike(userId, postId);

      return data;
    }

    if (
      !user.memberships.some(
        (membership) =>
          membership.school_id?.toString() === post.school_id?.toString(),
      )
    ) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'like',
        details: [
          {
            path: 'like',
            message:
              'Usuário não pode dar like em posts de escolas diferentes ao qual ele pertence.',
          },
        ],
        customMessage: 'Não é possivel dar like em escolas diferentes.',
      });
    }

    if (post.target.scope === 'all') {
      const data = await this.repository.toglleLike(userId, postId);

      return data;
    }

    if (user.memberships.some((user) => user.role === 'teacher')) {
      const data = await this.repository.toglleLike(userId, postId);

      return data;
    }

    const targetClassIds = (post.target?.target_ids ?? []).map((id) =>
      id?.toString(),
    );
    const associatedStudentIds = user.memberships.flatMap((membership) =>
      Array.isArray(membership.associated_students)
        ? membership.associated_students.map((studentId) =>
            studentId?.toString(),
          )
        : [],
    );

    const uniqueAssociatedStudentIds = [
      ...new Set(associatedStudentIds.filter(Boolean)),
    ];

    const associatedStudents = await Promise.all(
      uniqueAssociatedStudentIds.map(async (studentId) => {
        try {
          return await this.userRepository.getById(studentId);
        } catch {
          return null;
        }
      }),
    );

    const classExists = associatedStudents.some((student) =>
      student?.memberships?.some((membership) =>
        targetClassIds.includes(membership?.class_id?.toString()),
      ),
    );

    if (!classExists) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'like',
        details: [
          {
            path: 'like',
            message:
              'Usuário não pode dar like em post de turma/classe diferentes.',
          },
        ],
        customMessage:
          'Não é possivel dar like em post cujo o scope seja diferente de "all" e a turma não seja a mesma do usuário.',
      });
    }

    const data = await this.repository.toglleLike(userId, postId);

    return data;
  }
}
export default LikeService;
