import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class User {
  constructor() {
    const userSchema = new mongoose.Schema(
      {
        full_name: {
          type: String,
          index: true,
          required: true,
        },
        email: {
          type: String,
          unique: true,
          sparse: true,
          required: false,
        },
        password: {
          type: String,
          select: false,
          required: false,
        },
        google_id: {
          type: String,
          unique: true,
          sparse: true,
          select: false,
        },
        auth_provider: {
          type: String,
          enum: ['local', 'google'],
          default: 'local',
        },
        active: {
          type: Boolean,
          default: true,
        },
        groups: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'grupos',
          },
        ],
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
        fcm_tokens: [{ type: String }],
        avatar_url: {
          type: String,
          default: null,
        },
        memberships: [
          {
            school_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Schools',
              required: true,
            },
            role: {
              type: String,
              enum: ['admin', 'teacher', 'parent', 'student'],
              required: true,
            },
            // Apenas para role student
            class_id: {
              type: mongoose.Schema.Types.ObjectId,
              default: null,
            },
            // Apenas para role parent
            associated_students: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users',
              },
            ],
          },
        ],
        // Campos de infraestrutura de autenticação
        refresh_token: {
          type: String,
          select: false,
        },
        access_token: {
          type: String,
          select: false,
        },
        unique_token: {
          type: String,
          select: false,
        },
        password_recovery_code: {
          type: String,
          select: false,
        },
        password_recovery_code_exp: {
          type: Date,
          select: false,
        },
        invite_token: {
          type: String,
          select: false,
        },
        invited_at: {
          type: Date,
          select: false,
        },
        activated_at: {
          type: Date,
          select: false,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    userSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('Users', userSchema);
  }
}

export default new User().model;
