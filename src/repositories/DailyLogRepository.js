import DailyLogModel from '../models/DailyLog.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class DailyLogRepository {
  constructor({ dailyLogModel = DailyLogModel } = {}) {
    this.model = dailyLogModel;
  }

  async create(parsedData) {
    const dailyLog = new this.model(parsedData);
    return await dailyLog.save();
  }

  async list(req, accessScope = {}) {
    const id = req?.params?.id;
    const scopedStudentIds = Array.isArray(accessScope?.studentIds)
      ? accessScope.studentIds
      : null;
    const populate = [
      { path: 'student_id', select: '_id full_name avatar_url' },
      { path: 'teacher_id', select: '_id full_name avatar_url' },
      { path: 'school_id', select: '_id name' },
      { path: 'class_id', select: '_id name' },
      { path: 'dailylogtemplate_id', select: 'fields'}
    ];

    if (id) {
      const findByIdFilter = { _id: id };

      if (scopedStudentIds) {
        findByIdFilter.student_id = { $in: scopedStudentIds };
      }

      const data = await this.model.findOne(findByIdFilter).populate(populate);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'DailyLog',
          details: [],
          customMessage: messages.error.resourceNotFound('DailyLog'),
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      school_id,
      student_id,
      teacher_id,
      dailylogtemplate_id,
      is_present,
      read,
      ativo,
      date_from,
      date_to,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);

    const filters = {};

    if (school_id) filters.school_id = school_id;
    if (student_id) filters.student_id = student_id;
    if (teacher_id) filters.teacher_id = teacher_id;
    if (dailylogtemplate_id) filters.dailylogtemplate_id = dailylogtemplate_id;

    if (scopedStudentIds) {
      if (scopedStudentIds.length === 0) {
        filters.student_id = { $in: [] };
      } else if (filters.student_id) {
        const requestedStudentId = filters.student_id.toString();
        filters.student_id = scopedStudentIds.includes(requestedStudentId)
          ? requestedStudentId
          : { $in: [] };
      } else {
        filters.student_id = { $in: scopedStudentIds };
      }
    }

    if (is_present === 'true' || is_present === true) {
      filters.is_present = true;
    } else if (is_present === 'false' || is_present === false) {
      filters.is_present = false;
    }

    if (ativo === 'true' || ativo === true) {
      filters.ativo = true;
    } else if (ativo === 'false' || ativo === false) {
      filters.ativo = false;
    }

    if (read === 'true' || read === true) {
      filters.read_at = { $ne: null };
    } else if (read === 'false' || read === false) {
      filters.read_at = null;
    }

    if (date_from || date_to) {
      filters.date = {};

      if (date_from) {
        filters.date.$gte = new Date(date_from);
      }

      if (date_to) {
        filters.date.$lte = new Date(date_to);
      }
    }

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { date: -1, created_at: -1 },
      populate,
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) =>
      typeof doc.toObject === 'function' ? doc.toObject() : doc,
    );

    return result;
  }

  async update(id, parsedData) {
    const data = await this.model.findByIdAndUpdate(id, parsedData, {
      new: true,
    });

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'DailyLog',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLog'),
      });
    }

    return data;
  }

  async delete(id) {
    const data = await this.model.findByIdAndDelete(id);

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'DailyLog',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLog'),
      });
    }

    return data;
  }

  async getById(id, accessScope = {}) {
    const scopedStudentIds = Array.isArray(accessScope?.studentIds)
      ? accessScope.studentIds
      : null;
    const populate = [
      { path: 'student_id', select: '_id full_name avatar_url' },
      { path: 'teacher_id', select: '_id full_name avatar_url' },
      { path: 'school_id', select: '_id name' },
      { path: 'class_id', select: '_id name' },
    ];

    const findByIdFilter = { _id: id };

    if (scopedStudentIds) {
      findByIdFilter.student_id = { $in: scopedStudentIds };
    }

    const data = await this.model.findOne(findByIdFilter).populate(populate);

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'DailyLog',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLog'),
      });
    }

    return {
      ...data.toObject(),
    };
  }

  async markAsRead(id) {
    const data = await this.model.findByIdAndUpdate(
      id,
      { read_at: new Date() },
      { new: true },
    );

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'DailyLog',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLog'),
      });
    }

    return data;
  }

  async addAttachment(id, objectName) {
    const data = await this.model.findByIdAndUpdate(
      id,
      { $push: { attachments: objectName } },
      { new: true },
    );

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'DailyLog',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLog'),
      });
    }

    return data;
  }

  async removeAttachment(id, objectName) {
    const data = await this.model.findByIdAndUpdate(
      id,
      { $pull: { attachments: objectName } },
      { new: true },
    );
    return data;
  }
}

export default DailyLogRepository;
