import LikeModel from '../models/Like.js';

class LikeRepository {
    constructor() {
        this.model = LikeModel;
    }
    async toglleLike(userId, postId){
        
        const like = await this.model.findOne({user_id: userId, post_id:postId})

        if(!like){
            const like = await this.model.insertOne({user_id:userId, post_id: postId})

            return like
        }

        await this.model.findByIdAndDelete(like._id)
        
        return {message:"Like removido com sucesso."}
    }
}

export default LikeRepository;