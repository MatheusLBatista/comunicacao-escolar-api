import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class User {
  constructor() {
    const userSchema = new mongoose.Schema({
      nome: {
        type: String,
        index: true,
        required: true,
      },
      email: {
        type: String,
        unique: true,
        required: true,
      },
      senha: {
        type: String,
        select: false,
        required: false,
      },
      ativo: {
        type: Boolean,
        default: false,
      },
      tokenUnico: {
        type: String,
        select: false,
      },
      tokenConvite: {
        type: String,
        select: false,
      },
      convidadoEm: {
        type: Date,
        select: false,
      },
      ativadoEm: {
        type: Date,
        select: false,
      },
      refreshtoken: {
        type: String,
        select: false,
      },
      accesstoken: {
        type: String,
        select: false,
      },
      grupos: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'grupos',
        },
      ],
      permissoes: [
        {
          rota: { type: String, index: true, required: true },
          dominio: { type: String },
          ativo: { type: Boolean, default: false },
          buscar: { type: Boolean, default: false },
          enviar: { type: Boolean, default: false },
          substituir: { type: Boolean, default: false },
          modificar: { type: Boolean, default: false },
          excluir: { type: Boolean, default: false },
        },
      ],
      fotoPerfil: { type: String, required: false },
      fcm_tokens: [{ type: String }],
      memberships: [
        {
          school_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'escolas',
            required: true,
          },
          role: {
            type: String,
            enum: ['admin', 'teacher', 'parent', 'student'],
            required: true,
          },
          // Apenas para alunos
          class_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },
          // Apenas para pais
          associated_students: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Users',
            },
          ],
        },
      ],
    });

    userSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('Users', userSchema);
  }
}

export default new User().model;
