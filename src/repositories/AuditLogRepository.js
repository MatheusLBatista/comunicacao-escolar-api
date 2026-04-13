import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import AuditLogFilterBuilder from './filters/AuditLogFilterBuilder.js';

class AuditLogRepository {
  constructor(AuditLogModel = AuditLog) {
    this.model = AuditLogModel;
  }

  async list(req) {
    const id = req?.params?.logId || req?.params?.id;
    const populate = [
      { path: 'school_id', select: 'name tax_id active' },
      { path: 'user_id', select: 'full_name email active' },
      { path: 'student_id', select: 'full_name email active' },
    ];

    if (id && !req?.params?.resourceType && !req?.params?.userId && !req?.params?.studentId) {
      const data = await this.model.findById(id).populate(populate);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'AuditLog',
          details: [],
          customMessage: messages.error.resourceNotFound('AuditLog'),
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      user_id,
      resource_type,
      student_id,
      action,
      start_date,
      end_date,
      page = 1,
    } = req?.query || {};

    const schoolId = req?.params?.id;
    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);
    const filterBuilder = new AuditLogFilterBuilder()
      .withSchoolId(schoolId)
      .withUserId(req?.params?.userId || user_id || '')
      .withResourceType(req?.params?.resourceType || resource_type || '')
      .withResourceId(req?.params?.resourceId || '')
      .withStudentId(req?.params?.studentId || student_id || '')
      .withAction(action || '')
      .withDateRange(start_date, end_date);

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { created_at: -1 },
      populate,
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) => {
      const logObj = typeof doc.toObject === 'function' ? doc.toObject() : doc;

      return {
        ...logObj,
      };
    });

    return result;
  }

  async create(data) {
    const auditLog = new this.model(data);
    return await auditLog.save();
  }

  async summary(req) {
    const schoolId = req?.params?.id;
    const { start_date, end_date, group_by = 'resource_type' } = req?.query || {};

    const matchStage = { school_id: new mongoose.Types.ObjectId(schoolId) };

    if (start_date || end_date) {
      matchStage.created_at = {};
      if (start_date) matchStage.created_at.$gte = new Date(start_date);
      if (end_date) matchStage.created_at.$lte = new Date(end_date);
    }

    const groupFieldMap = {
      user: '$user_id',
      resource_type: '$resource_type',
      student: '$student_id',
      day: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
    };

    const groupField = groupFieldMap[group_by] || '$resource_type';

    const [aggregation, totals] = await Promise.all([
      this.model.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupField,
            count: { $sum: 1 },
            unique_users: { $addToSet: '$user_id' },
          },
        },
        {
          $project: {
            key: '$_id',
            count: 1,
            unique_users: { $size: '$unique_users' },
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
      ]),
      this.model.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total_accesses: { $sum: 1 },
            unique_users: { $addToSet: '$user_id' },
          },
        },
        {
          $project: {
            total_accesses: 1,
            unique_users: { $size: '$unique_users' },
            _id: 0,
          },
        },
      ]),
    ]);

    return {
      period: {
        start: start_date || null,
        end: end_date || null,
      },
      total_accesses: totals[0]?.total_accesses || 0,
      unique_users: totals[0]?.unique_users || 0,
      groups: aggregation,
    };
  }

  async getById(id) {
    const data = await this.model.findById(id);

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'AuditLog',
        details: [],
        customMessage: messages.error.resourceNotFound('AuditLog'),
      });
    }

    return data;
  }
}

export default AuditLogRepository;
