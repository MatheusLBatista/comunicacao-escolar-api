import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class DailyLog {
  constructor() {
    const dailyLogSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'escolas',
          required: true,
          index: true,
        },
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'usuarios',
          required: true,
          index: true,
        },
        teacher_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'usuarios',
          required: true,
        },
        is_present: {
          type: Boolean,
          required: true,
        },
        // Respostas dinâmicas baseadas no DailyLogTemplate
        entries: [
          {
            field_key: { type: String, required: true },
            value: { type: String, required: true },
          },
        ],
        attachments: [{ type: String }],
        read_at: {
          type: Date,
          default: null,
        },
        date: {
          type: Date,
          required: true,
          index: true,
        },
        ativo: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    dailyLogSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('daily_logs', dailyLogSchema);
  }
}

export default new DailyLog().model;
