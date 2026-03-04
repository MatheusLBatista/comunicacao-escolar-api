import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class School {
  constructor() {
    const schoolSchema = new mongoose.Schema(
      {
        nome: {
          type: String,
          required: true,
          index: true,
        },
        cnpj: {
          type: String,
          unique: true,
          required: true,
        },
        endereco: {
          logradouro: { type: String },
          cidade: { type: String },
          estado: { type: String },
          cep: { type: String },
        },
        ativo: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    schoolSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('Schools', schoolSchema);
  }
}

export default new School().model;
