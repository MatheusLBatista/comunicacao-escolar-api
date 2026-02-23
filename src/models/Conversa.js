import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Conversa {
  constructor() {
    const conversaSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'escolas',
          required: true,
          index: true,
        },
        participants: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'usuarios',
          },
        ],
        type: {
          type: String,
          enum: ['private', 'daily_log_reply'],
          default: 'private',
        },
        last_message_at: {
          type: Date,
          default: null,
        },
        ativo: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    conversaSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('conversas', conversaSchema);
  }
}

export default new Conversa().model;
