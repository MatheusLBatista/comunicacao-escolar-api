import PickupLog from '../models/PickupLog.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import PickupLogFilterBuilder from './filters/PickupLogFilterBuilder.js';

class PickupLogRepository {
  constructor(PickupLogModel = PickupLog) {
    this.model = PickupLogModel;
  }

  async getById(id) {
    const data = await this.model.findById(id);

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'PickupLog',
        details: [],
        customMessage: messages.error.resourceNotFound('PickupLog'),
      });
    }

    return data;
  }

  async create(parsedData) {
    const data = await this.model.create(parsedData);

    return data;
  }

  async list(req, accessScope = {}) {
    const id = req?.params?.id;
    const scopedStudentIds = Array.isArray(accessScope?.studentIds)
      ? accessScope.studentIds
      : null;
    const populate = [
      'school_id',
      { path: 'student_id', select: '_id full_name email avatar_url memberships' },
      {
        path: 'authorization_id',
        select:
          '_id student_id authorized_by valid_from valid_until active used',
      },
      { path: 'verified_by', select: '_id full_name email' },
      { path: 'picked_up_by.user_id', select: '_id full_name email' },
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
          field: 'PickupLog',
          details: [],
          customMessage: messages.error.resourceNotFound('PickupLog'),
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      school_id,
      student_id,
      authorization_id,
      verified_by,
      method,
      active,
      start_date,
      end_date,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);

    const filterBuilder = new PickupLogFilterBuilder()
      .withSchoolId(school_id || '')
      .withStudentId(student_id || '')
      .withStudentIds(scopedStudentIds)
      .withAuthorizationId(authorization_id || '')
      .withVerifiedBy(verified_by || '')
      .withMethod(method || '')
      .withActive(active)
      .withDepartureTimeRange(start_date, end_date);

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { departure_time: -1 },
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
        field: 'PickupLog',
        details: [],
        customMessage: messages.error.resourceNotFound('PickupLog'),
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
        field: 'PickupLog',
        details: [],
        customMessage: messages.error.resourceNotFound('PickupLog'),
      });
    }

    return data;
  }
}

export default PickupLogRepository;
