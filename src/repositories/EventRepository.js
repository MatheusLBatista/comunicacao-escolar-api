import Event from '../models/Event.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import EventFilterBuilder from './filters/EventFilterBuilder.js';

class EventRepository {
  constructor(EventModel = Event) {
    this.model = EventModel;
  }

  async list(req, accessScope = {}) {
    const id = req?.params?.id;
    const scopedSchoolIds = Array.isArray(accessScope?.schoolIds)
      ? accessScope.schoolIds
      : null;
    const populate = [
      { path: 'school_id', select: 'name tax_id active' },
      { path: 'created_by', select: 'full_name email active' },
      { path: 'target.target_id', select: 'name grade year school_id active' },
    ];

    if (id) {
      const data = await this.model.findById(id).populate(populate);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Event',
          details: [],
          customMessage: messages.error.resourceNotFound('Event'),
        });
      }

      const schoolIdStr = data.school_id?._id
        ? data.school_id._id.toString()
        : data.school_id?.toString();

      if (scopedSchoolIds && !scopedSchoolIds.includes(schoolIdStr)) {
        throw new CustomError({
          statusCode: 403,
          errorType: 'forbidden',
          field: 'event',
          details: [],
          customMessage: 'Você não tem acesso a este evento.',
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      type,
      active,
      scope,
      target_id,
      start_date,
      end_date,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);
    const filterBuilder = new EventFilterBuilder()
      .withType(type || '')
      .withActive(active)
      .withScope(scope || '')
      .withTargetId(target_id || '')
      .withStartDateRange(start_date, end_date);

    if (scopedSchoolIds) {
      filterBuilder.withSchoolIds(scopedSchoolIds);
    }

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { start_date: 1 },
      populate,
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) => {
      const eventObj =
        typeof doc.toObject === 'function' ? doc.toObject() : doc;

      return {
        ...eventObj,
      };
    });

    return result;
  }

  async create(parsedData) {
    const event = new this.model(parsedData);
    return await event.save();
  }

  async update(id, parsedData) {
    const data = await this.model.findByIdAndUpdate(id, parsedData, {
      new: true,
    });

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Event',
        details: [],
        customMessage: messages.error.resourceNotFound('Event'),
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
        field: 'Event',
        details: [],
        customMessage: messages.error.resourceNotFound('Event'),
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
        field: 'Event',
        details: [],
        customMessage: messages.error.resourceNotFound('Event'),
      });
    }

    return data;
  }
}

export default EventRepository;
