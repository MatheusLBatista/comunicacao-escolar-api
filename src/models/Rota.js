import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Rota {
  constructor() {
    const rotaSchema = new mongoose.Schema(
      {
        rota: { type: String, index: true, trim: true, lowercase: true },
        dominio: { type: String, required: true },
        ativo: { type: Boolean, default: false }, // false
        buscar: { type: Boolean, default: false }, // false
        enviar: { type: Boolean, default: false }, // false
        substituir: { type: Boolean, default: false }, // false
        modificar: { type: Boolean, default: false }, // false
        excluir: { type: Boolean, default: false }, // falseæ
      },
      { timestamps: true },
    );

    rotaSchema.index({ rota: 1, dominio: 1 }, { unique: true });
    rotaSchema.plugin(mongoosePaginate);

    rotaSchema.pre('save', function (next) {
      if (this.rota) {
        this.rota = this.rota.toLowerCase();
      }
      next();
    });

    this.model = mongoose.model('rotas', rotaSchema);
  }
}

export default new Rota().model;
