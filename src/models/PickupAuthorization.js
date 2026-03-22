import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class PickupAuthorization {
  constructor() {
    const pickupAuthorizationSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Schools',
        },
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Users',
        },
        authorized_by: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Users',
        },
        authorized_person: {
          name: {
            type: String,
            required: true,
          },
          document: {
            type: String,
            required: true,
          },
          relationship: {
            type: String,
          },
          photo_url: {
            type: String,
          },
        },
        qr_code: {
          type: String,
          unique: true,
        },
        valid_from: {
          type: Date,
          required: true,
        },
        valid_until: {
          type: Date,
          required: true,
        },
        used: {
          type: Boolean,
          default: false,
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    pickupAuthorizationSchema.plugin(mongoosePaginate);

    this.model = mongoose.model(
      'pickup_authorizations',
      pickupAuthorizationSchema,
    );
  }
}

export default new PickupAuthorization().model;
