import LikeRepository from "../repositories/LikeRepository";

class LikeService {
    constructor({likeRepository = LikeRepository}) {
        this.repository = new likeRepository()
    }

    async toggleLike(user, post) {
        
        const like = await this.repository(user,)
    }
}
export default LikeService