import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Message {
  constructor() {
    const messageSchema = new mongoose.Schema(
      {
        conversation_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'conversas',
          required: true,
          index: true,
        },
        sender_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'usuarios',
          required: true,
        },
        texto: {
          type: String,
          required: true,
        },
        read_by: [
          {
            user_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'usuarios',
            },
            at: { type: Date },
          },
        ],
        sent_at: {
          type: Date,
          default: Date.now,
        },
        ativo: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: false },
    );

    messageSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('Messages', messageSchema);
  }
}

export default new Message().model;
