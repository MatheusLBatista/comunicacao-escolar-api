import PostModel from '../models/Post.js';

class PostRepository {
  constructor() {
    this.model = PostModel;
  }

  async createModel(parsedData) {
    const data = await this.model.insertOne(parsedData);
    return data;
  }
}

export default PostRepository;
