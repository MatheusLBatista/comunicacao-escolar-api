import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Like {
  constructor() {
    const likeSchema = new mongoose.Schema(
      {
        post_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'posts',
          required: true,
          index: true,
        },
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'usuarios',
          required: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: false } },
    );

    likeSchema.index({ post_id: 1, user_id: 1 }, { unique: true });
    likeSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('likes', likeSchema);
  }
}

export default new Like().model;
