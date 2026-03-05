import LikeService from "../services/LikeService";
import {
  CommonResponse,
  CustomError,
  HttpStatusCodes,
} from '../utils/helpers/index.js';
import { UsuarioIdSchema } from "../utils/validators/schemas/zod/querys/UsuarioQuerySchema";

class LikeController {
    constructor() {
        this.service = new LikeService();
    }

    async toggleLike(req, res) {

        const {post} = req.body;
        if(post) {
            UsuarioIdSchema.parse(post);
        }
        const data = await this.service.toggleLike(req.user_id, post);
        CommonResponse.success(res, data);
    }
}

export default LikeController;