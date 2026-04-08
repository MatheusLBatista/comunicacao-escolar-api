import LikeRepository from "../repositories/LikeRepository.js";

class LikeService {
    constructor() {
        this.repository = new LikeRepository();
    }

    async toggleLike(user, post) {
        
        const data = await this.repository.toglleLike(user, post);

        return data;
    }
}
export default LikeService;