import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class DailyLogTemplate {
  constructor() {
    const dailyLogTemplateSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'escolas',
          required: true,
          index: true,
        },
        // Quando preenchido, o template é exclusivo para acompanhamento de um aluno específico
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'usuarios',
          default: null,
        },
        fields: [
          {
            key: { type: String, required: true }, // ex: "mood_status"
            label: { type: String, required: true }, // ex: "Disposição"
            type: {
              type: String,
              enum: ['select', 'text', 'boolean'],
              required: true,
            },
            options: [{ type: String }], // Apenas para type "select"
          },
        ],
        ativo: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    dailyLogTemplateSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('daily_log_templates', dailyLogTemplateSchema);
  }
}

export default new DailyLogTemplate().model;
