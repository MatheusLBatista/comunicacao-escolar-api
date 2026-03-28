import Event from '../models/Event.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import EventFilterBuilder from './filters/EventFilterBuilder.js';

class EventRepository {
  constructor(EventModel = Event) {
    this.model = EventModel;
  }

  async list(req) {
    const id = req?.params?.id;

    if (id) {
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

      return {
        ...data.toObject(),
      };
    }

    const {
      type,
      active,
      scope,
      start_date,
      end_date,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);
    const filterBuilder = new EventFilterBuilder()
      .withType(type || '')
      .withActive(active)
      .withScope(scope || '')
      .withStartDateRange(start_date, end_date);

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { start_date: 1 },
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
}

export default EventRepository;
