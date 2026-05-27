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
      { path: 'target.target_ids', select: 'name grade year school_id active' },
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

      return this._flattenEvent(data.toObject());
    }

    const {
      type,
      active,
      scope,
      target_ids,
      start_date,
      end_date,
      month,
      year,
      page = 1,
    } = req?.query || {};

    let resolvedStartDate = start_date;
    let resolvedEndDate = end_date;
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      resolvedStartDate = new Date(y, m - 1, 1).toISOString();
      resolvedEndDate = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    }

    const parsedTargetIds = target_ids
      ? Array.isArray(target_ids) ? target_ids : [target_ids]
      : [];

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 200);
    const filterBuilder = new EventFilterBuilder()
      .withType(type || '')
      .withActive(active)
      .withScope(scope || '')
      .withTargetIds(parsedTargetIds)
      .withStartDateRange(resolvedStartDate, resolvedEndDate);

    if (scopedSchoolIds) {
      filterBuilder.withSchoolIds(scopedSchoolIds);
    }

    if (accessScope.parentClassIds !== undefined) {
      filterBuilder.withParentClassFilter(accessScope.parentClassIds);
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
      return this._flattenEvent(eventObj);
    });

    return result;
  }

  _flattenEvent(eventObj) {
    const targetIds = eventObj?.target?.target_ids ?? [];
    const class_ids = targetIds.map((t) =>
      t?._id ? String(t._id) : String(t),
    );
    const class_names = targetIds
      .filter((t) => t?.name)
      .map((t) => t.name);

    return {
      ...eventObj,
      class_ids,
      class_names,
    };
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
