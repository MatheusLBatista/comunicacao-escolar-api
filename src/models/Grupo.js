import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Grupo {
  constructor() {
    const grupoSchema = new mongoose.Schema(
      {
        nome: { type: String, index: true, unique: true },
        descricao: { type: String, required: true },
        ativo: { type: Boolean, default: true },
        permissions: [
          {
            route: { type: String, index: true, required: true },
            domain: { type: String },
            active: { type: Boolean, default: false },
            get: { type: Boolean, default: false },
            post: { type: Boolean, default: false },
            put: { type: Boolean, default: false },
            patch: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
          },
        ],
      },
      {
        timestamps: true,
        versionKey: false,
      },
    );

    grupoSchema.pre('save', function (next) {
      const permissions = this.permissions;
      const combinations = permissions.map((p) => `${p.route}_${p.domain}`);
      const setCombinations = new Set(combinations);

      if (combinations.length !== setCombinations.size) {
        return next(
          new Error(
            'Permissões duplicadas encontradas: route + domain devem ser únicos dentro de cada grupo.',
          ),
        );
      }

      next();
    });

    grupoSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('grupos', grupoSchema);
  }
}

export default new Grupo().model;
