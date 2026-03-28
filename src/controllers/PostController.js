import { PostSchemaInput } from '../utils/validators/schemas/zod/PostSchema.js';
import PostService from '../services/PostService.js';
import { CommonResponse } from '../utils/helpers/index.js';
import { UserIdSchema } from '../utils/validators/schemas/zod/querys/UserQuerySchema.js';
import { PostQuerySchema } from '../utils/validators/schemas/zod/querys/PostQuerySchema.js';

class PostController {
  constructor() {
    this.service = new PostService();
  }


  async list(req, res) {

    const {id} = req.param || {}

    if(id) {
      UserIdSchema.parse(id)
    }

    const query = req.query || {}

    if (Object.keys(query).length !== 0) {
      await PostQuerySchema.safeParseAsync(query)
    }

    const data = await this.service.list(req)

    return CommonResponse.success(res, data)
  }

  async create(req, res) {
    const body = req.body;
    body.author_id = req.user_id;
    console.log(req.user_id);
    const parsedData = PostSchemaInput.parse(body);

    const data = await this.service.create(parsedData);

    return CommonResponse.created(res, data);
  }
}

export default PostController;
