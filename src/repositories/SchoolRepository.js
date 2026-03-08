import School from '../models/School.js';
import mongoose from 'mongoose';
import { CustomError, messages } from '../utils/helpers/index.js';

class SchoolRepository {
  constructor(SchoolModel = School) {
    this.model = SchoolModel;
  }

  async create(schoolData) {
    const school = new this.model(schoolData);
    return await school.save();
  }

  async list(req) {
    const { id } = req.params || null;

    if (id) {
      const data = await this.model.findById(id);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'School',
          details: [],
          customMessage: messages.error.resourceNotFound('School'),
        });
      }

      const dataWithStats = {
        ...data.toObject(),
      };

      return dataWithStats;
    }

    const data = await this.model.find();
    return data;
  }

  async update(id, parsedData) {
    const School = await this.model.findByIdAndUpdate(id, parsedData, {
      new: true,
    });

    if (!School) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'School',
        details: [],
        customMessage: messages.error.resourceNotFound('School'),
      });
    }

    return School;
  }

  async findByName(name, ignoredId = null) {
    const filter = { name };

    if (ignoredId) {
      filter._id = { $ne: ignoredId };
    }
    const document = await this.model.findOne(filter);

    return document;
  }

  async findByTaxId(tax_id, ignoredId = null) {
    const filter = { tax_id };

    if (ignoredId) {
      filter._id = { $ne: ignoredId };
    }
    const document = await this.model.findOne(filter);

    return document;
  }

  async findById(id, includeTokens = false) {
    let query = this.model.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (includeTokens) {
      query = query.select('+refreshtoken +accesstoken');
    }

    const School = await query;

    if (!School) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'School',
        details: [],
        customMessage: messages.error.resourceNotFound('School'),
      });
    }

    return School;
  }
}

export default SchoolRepository;
