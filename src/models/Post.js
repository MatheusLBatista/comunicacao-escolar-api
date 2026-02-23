import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Post {
  constructor() {
    const postSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'escolas',
          required: true,
          index: true,
        },
        author_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'usuarios',
          required: true,
        },
        titulo: {
          type: String,
          required: true,
        },
        conteudo: {
          type: String,
          required: true,
        },
        target: {
          scope: {
            type: String,
            enum: ['all', 'class'],
            default: 'all',
          },
          target_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },
        },
        attachments: [{ type: String }],
        ativo: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    postSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('posts', postSchema);
  }
}

export default new Post().model;
