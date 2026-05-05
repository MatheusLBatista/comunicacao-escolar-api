import PickupAuthorization from '../models/PickupAuthorization.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import PickupAuthorizationFilterBuilder from './filters/PickupAuthorizationFilterBuilder.js';

class PickupAuthorizationRepository {
  constructor(PickupAuthorizationModel = PickupAuthorization) {
    this.model = PickupAuthorizationModel;
  }

  async getById(id) {
    const data = await this.model.findById(id);

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'PickupAuthorization',
        details: [],
        customMessage: messages.error.resourceNotFound('PickupAuthorization'),
      });
    }

    return data;
  }

  async create(parsedData) {
    const data = await this.model.create(parsedData);

    return data;
  }

  async update(id, parsedData) {
    const data = await this.model.findByIdAndUpdate(id, parsedData, {
      new: true,
    });

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'PickupAuthorization',
        details: [],
        customMessage: messages.error.resourceNotFound('PickupAuthorization'),
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
        field: 'PickupAuthorization',
        details: [],
        customMessage: messages.error.resourceNotFound('PickupAuthorization'),
      });
    }

    return data;
  }

  async list(req, accessScope = {}) {
    const id = req?.params?.id;
    const scopedStudentIds = Array.isArray(accessScope?.studentIds)
      ? accessScope.studentIds
      : null;

    if (id) {
      const findByIdFilter = { _id: id };

      if (scopedStudentIds) {
        findByIdFilter.student_id = { $in: scopedStudentIds };
      }

      const data = await this.model
        .findOne(findByIdFilter)
        .populate('school_id')
        .populate({ path: 'student_id', select: '_id full_name email' })
        .populate({ path: 'authorized_by', select: '_id full_name email' });

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'PickupAuthorization',
          details: [],
          customMessage: messages.error.resourceNotFound('PickupAuthorization'),
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      school_id,
      student_id,
      authorized_by,
      used,
      active,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);
    const filterBuilder = new PickupAuthorizationFilterBuilder()
      .withSchoolId(school_id || '')
      .withStudentId(student_id || '')
      .withStudentIds(scopedStudentIds)
      .withAuthorizedBy(authorized_by || '')
      .withUsed(used)
      .withActive(active);

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { created_at: -1 },
      populate: [
        'school_id',
        { path: 'student_id', select: '_id full_name email' },
        { path: 'authorized_by', select: '_id full_name email' },
      ],
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) =>
      typeof doc.toObject === 'function' ? doc.toObject() : doc,
    );

    return result;
  }
}

export default PickupAuthorizationRepository;
