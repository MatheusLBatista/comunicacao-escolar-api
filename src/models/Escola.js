import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Escola {
  constructor() {
    const escolaSchema = new mongoose.Schema(
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

    escolaSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('escolas', escolaSchema);
  }
}

export default new Escola().model;
