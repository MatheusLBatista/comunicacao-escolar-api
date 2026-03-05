import LikeRepository from "../repositories/LikeRepository";

class LikeService {
    constructor({likeRepository = LikeRepository}) {
        this.repository = new likeRepository();
    }

    async toggleLike(user, post) {
        
        const data = await this.repository(user, post);

        return data;
    }
}
export default LikeService;