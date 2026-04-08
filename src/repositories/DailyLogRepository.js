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

  async list(req) {
    const id = req?.params?.id;

    if (id) {
      const data = await this.model.findById(id);

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

  async getById(id) {
    const data = await this.model.findById(id);

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
}

export default DailyLogRepository;
