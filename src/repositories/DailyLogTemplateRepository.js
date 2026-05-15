import DailyLogTemplateModel from '../models/DailyLogTemplate.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class DailyLogTemplateRepository {
  constructor({ dailyLogTemplateModel = DailyLogTemplateModel } = {}) {
    this.model = dailyLogTemplateModel;
  }

  async create(parsedData) {
    const template = new this.model(parsedData);
    return await template.save();
  }

  async list(req) {
    const id = req?.params?.id;

    if (id) {
      const data = await this.model.findById(id);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'DailyLogTemplate',
          details: [],
          customMessage: messages.error.resourceNotFound('DailyLogTemplate'),
        });
      }

      return data;
    }

    const { school_id, student_id, ativo, page = 1 } = req?.query || {};
    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);

    const filters = {};

    if (school_id) filters.school_id = school_id;
    if (student_id) filters.student_id = student_id;

    if (ativo === 'true' || ativo === true) {
      filters.ativo = true;
    } else if (ativo === 'false' || ativo === false) {
      filters.ativo = false;
    }

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { created_at: -1 },
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
        field: 'DailyLogTemplate',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLogTemplate'),
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
        field: 'DailyLogTemplate',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLogTemplate'),
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
        field: 'DailyLogTemplate',
        details: [],
        customMessage: messages.error.resourceNotFound('DailyLogTemplate'),
      });
    }

    return data;
  }
}

export default DailyLogTemplateRepository;
