import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Rota {
  constructor() {
    const rotaSchema = new mongoose.Schema(
      {
        route: { type: String, index: true, trim: true, lowercase: true },
        domain: { type: String, required: true },
        active: { type: Boolean, default: false },
        get: { type: Boolean, default: false },
        post: { type: Boolean, default: false },
        put: { type: Boolean, default: false },
        patch: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      { timestamps: true },
    );

    rotaSchema.index({ route: 1, domain: 1 }, { unique: true });
    rotaSchema.plugin(mongoosePaginate);

    rotaSchema.pre('save', function (next) {
      if (this.route) {
        this.route = this.route.toLowerCase();
      }
      next();
    });

    this.model = mongoose.model('rotas', rotaSchema);
  }
}

export default new Rota().model;
