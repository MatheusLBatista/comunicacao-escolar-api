import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Conversation {
  constructor() {
    const conversationSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Schools',
          required: true,
          index: true,
        },
        participants: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
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
        active: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    conversationSchema.index({ school_id: 1, last_message_at: -1 });

    conversationSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('Conversations', conversationSchema);
  }
}

export default new Conversation().model;
