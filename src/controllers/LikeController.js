import LikeService from "../services/LikeService.js";
import {
  CommonResponse,
  CustomError,
  HttpStatusCodes,
} from '../utils/helpers/index.js';
import { UserIdSchema } from "../utils/validators/schemas/zod/querys/UserQuerySchema.js";

class LikeController {
    constructor() {
        this.service = new LikeService();
    }

    async toggleLike(req, res) {

        const {post} = req.body;
        if(post) {
            UserIdSchema.parse(post);
        }
        const data = await this.service.toggleLike(req.user_id, post);
        CommonResponse.success(res, data);
    }
}

export default LikeController;