import { PostSchema } from "../utils/validators/schemas/zod/PostSchema"

class PostController {
    constructor() {
        this.service
    }

    async createPost (req, res) {
        const body = req.body
        const parsedBody = PostSchema.parse(body)


    }
}

export default PostController