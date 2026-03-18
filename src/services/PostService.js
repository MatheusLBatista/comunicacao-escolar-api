import PostRepository from "../repositories/PostRepository.js"

class PostService {
    constructor() {
        this.repository = new PostRepository()
    }
    async createPost(parsedData) {
        const data =  await this.repository.createModel(parsedData)
        return data
    }
}
export default PostService