import School from '../models/School.js';
import mongoose from 'mongoose';
import { CustomError, messages } from '../utils/helpers/index.js';
import SchoolFilterBuilder from './filters/SchoolFilterBuilder.js';

class SchoolRepository {
  constructor(SchoolModel = School) {
    this.model = SchoolModel;
  }

  async create(schoolData) {
    const school = new this.model(schoolData);
    return await school.save();
  }

  async list(req) {
    const id = req?.params?.id;

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

      return {
        ...data.toObject(),
      };
    }

    const {
      name,
      tax_id,
      active,
      city,
      state,
      zipCode,
      address,
      page = 1,
    } = req.query;

    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filterBuilder = new SchoolFilterBuilder()
      .withName(name || '')
      .withTaxId(tax_id || '')
      .withActive(active)
      .withCity(city || '')
      .withState(state || '')
      .withZipCode(zipCode || '')
      .withAddress(address || '');

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { name: 1 },
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) => {
      const schoolObj =
        typeof doc.toObject === 'function' ? doc.toObject() : doc;

      return {
        ...schoolObj,
      };
    });

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
        field: 'School',
        details: [],
        customMessage: messages.error.resourceNotFound('School'),
      });
    }

    return data;
  }

  async delete(id) {
    const data = await this.model.findByIdAndDelete(id);
    return data;
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
