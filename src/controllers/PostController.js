import {
  PostSchemaInput,
  PostSchemaUpdate,
} from '../utils/validators/schemas/zod/PostSchema.js';
import PostService from '../services/PostService.js';
import { CommonResponse } from '../utils/helpers/index.js';
import { UserIdSchema } from '../utils/validators/schemas/zod/querys/UserQuerySchema.js';
import { PostQuerySchema } from '../utils/validators/schemas/zod/querys/PostQuerySchema.js';
import ObjectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';

class PostController {
  constructor() {
    this.service = new PostService();
  }

  async list(req, res) {
    const { id } = req.params || {};

    const { schoolId } = req.params || {};

    if (id) {
      UserIdSchema.parse(id);
    }

    if (schoolId) {
      UserIdSchema.parse(schoolId);
    }

    if (id) {
      UserIdSchema.parse(id);
    }

    const query = req.query || {};

    if (Object.keys(query).length !== 0) {
      await PostQuerySchema.safeParseAsync(query);
    }

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async create(req, res) {
    const { schoolId } = req.params;
    ObjectIdSchema.parse(schoolId);

    const body = req.body;
    const userId = req.user_id;
    const parsedData = PostSchemaInput.parse(body);

    const data = await this.service.create(parsedData, userId, schoolId);

    return CommonResponse.created(res, data);
  }

  async update(req, res) {
    const body = req.body;

    const { id } = req.params || {};

    UserIdSchema.parse(id);

    const parsedData = PostSchemaUpdate.parse(body);

    const userId = req.user_id;

    const data = await this.service.update(id, parsedData, userId);

    return CommonResponse.success(res, data);
  }

  async delete(req, res) {
    const {id} = req.params ||  {}
    const userId = req.user_id
    ObjectIdSchema.parse(id)

    await this.service.delete(id, userId)

    return CommonResponse.success(res,{message: "Anúncio deletado com sucesso"})
  }

  async uploadFoto(req, res) {

    const {id} = req.params || {}

    UserIdSchema.parse(id);

    const data = await this.service.uploadFoto(req, id)

    return CommonResponse.created(res, data)
  }

  async deleteFoto(req, res) {
    const {id} = req.params || {}

    const {postId} = req.params || {}

    UserIdSchema.parse(id)
    UserIdSchema.parse(postId)

    const data = await this.service.deleteFoto(req, postId, id)

    return CommonResponse.success(200, data)

  }

}

export default PostController;
