import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Message {
  constructor() {
    const messageSchema = new mongoose.Schema(
      {
        conversation_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Conversations',
          required: true,
          index: true,
        },
        sender_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Users',
          required: true,
        },
        text: {
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
        active: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: false },
    );

    messageSchema.index({ conversation_id: 1, sent_at: -1 });

    messageSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('Messages', messageSchema);
  }
}

export default new Message().model;
