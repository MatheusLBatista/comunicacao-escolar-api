import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class School {
  constructor() {
    const schoolSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: true,
          index: true,
        },
        tax_id: {
          type: String,
          unique: true,
          required: true,
        },
        address: {
          street: { type: String },
          city: { type: String },
          state: { type: String },
          zip_code: { type: String },
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    schoolSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('schools', schoolSchema);
  }
}

export default new School().model;
