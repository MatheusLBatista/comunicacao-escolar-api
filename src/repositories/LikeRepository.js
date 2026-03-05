import LikeModel from '../models/Like.js';

class LikeRepository {
    constructor({likeModel = LikeModel} ){
        this.model = likeModel();
    }
    async toglleLike(user, post){
        
        const like = await this.model.findOne({user_id:user, post_id:post}).exec();
        if(!like) {
            return await this.model.insertOne({user_id:user, post_id:post}).exec();
        }
        return await this.model.deleteOne({user_id:user, post_id:post}).exec();
    }
}

export default LikeRepository;