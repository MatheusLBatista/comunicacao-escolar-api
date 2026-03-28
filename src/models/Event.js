import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Event {
  constructor() {
    const eventSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Schools',
          required: true,
          index: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          default: '',
        },
        type: {
          type: String,
          enum: ['event', 'meeting', 'commemorative', 'pedagogical'],
          required: true,
        },
        start_date: {
          type: Date,
          required: true,
        },
        end_date: {
          type: Date,
          default: null,
        },
        all_day: {
          type: Boolean,
          default: false,
        },
        target: {
          scope: {
            type: String,
            enum: ['all', 'class'],
            default: 'all',
          },
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Users',
          required: true,
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    eventSchema.index({ school_id: 1, start_date: 1 });
    eventSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('events', eventSchema);
  }
}

export default new Event().model;
