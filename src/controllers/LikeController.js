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
        const userId = req.user_id
        
        const {id} = req.params || {}

        UserIdSchema.parse(id)

        const data = await this.service.toggleLike(userId, id);
        CommonResponse.success(res, data);
    }
}

export default LikeController;