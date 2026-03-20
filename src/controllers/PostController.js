import { PostSchema, PostSchemaInput } from "../utils/validators/schemas/zod/PostSchema.js"
import PostService from "../services/PostService.js"
import { CommonResponse } from '../utils/helpers/index.js';

class PostController {
    constructor() {
        this.service = new PostService()
    }

    async createPost (req, res) {
        const body = req.body
        body.author_id = req.user_id
        console.log(req.user_id)
        const parsedData = PostSchemaInput.parse(body)
        
        const data = await this.service.createPost(parsedData)

        return CommonResponse.created(res, data)
    }
}

export default PostController