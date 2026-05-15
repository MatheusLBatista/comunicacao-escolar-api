import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class PickupLog {
  constructor() {
    const pickupLogSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Schools',
          index: true,
        },
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Users',
          index: true,
        },
        authorization_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'pickup_authorizations',
          default: null,
        },
        picked_up_by: {
          user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            default: null,
          },
          name: {
            type: String,
            required: true,
          },
          document: {
            type: String,
            required: true,
          },
        },
        method: {
          type: String,
          enum: ['qr_code', 'manual'],
          required: true,
        },
        departure_time: {
          type: Date,
          required: true,
          index: true,
        },
        verified_by: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Users',
        },
        notes: {
          type: String,
          default: '',
        },
        active: {
          type: Boolean,
          default: true,
          index: true,
        },
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    );

    pickupLogSchema.index({ school_id: 1, student_id: 1, departure_time: -1 });
    pickupLogSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('pickup_logs', pickupLogSchema);
  }
}

export default new PickupLog().model;
