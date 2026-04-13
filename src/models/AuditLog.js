import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class AuditLog {
  constructor() {
    const auditLogSchema = new mongoose.Schema(
      {
        school_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Schools',
          required: true,
          index: true,
        },
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Users',
          required: true,
        },
        user_role: {
          type: String,
          enum: ['admin', 'teacher', 'parent'],
          required: true,
        },
        action: {
          type: String,
          enum: ['view', 'download', 'export'],
          required: true,
        },
        resource_type: {
          type: String,
          enum: [
            'daily_log',
            'announcement',
            'message',
            'conversation',
            'incident',
            'event',
            'pickup_log',
            'student_profile',
          ],
          required: true,
        },
        resource_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        resource_summary: {
          type: String,
          default: '',
        },
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Users',
          default: null,
        },
        ip_address: {
          type: String,
          default: '',
        },
        user_agent: {
          type: String,
          default: '',
        },
        device_info: {
          platform: {
            type: String,
            enum: ['ios', 'android', 'web', ''],
            default: '',
          },
          app_version: {
            type: String,
            default: '',
          },
          os_version: {
            type: String,
            default: '',
          },
        },
        session_id: {
          type: String,
          default: '',
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
      {
        timestamps: { createdAt: 'created_at', updatedAt: false },
      },
    );

    auditLogSchema.index({ school_id: 1, resource_type: 1, created_at: -1 });
    auditLogSchema.index({ school_id: 1, user_id: 1, created_at: -1 });
    auditLogSchema.index({ school_id: 1, student_id: 1, created_at: -1 });

    auditLogSchema.plugin(mongoosePaginate);

    this.model = mongoose.model('auditlogs', auditLogSchema);
  }
}

export default new AuditLog().model;
