import EventService from '../services/EventService.js';
import { CommonResponse, HttpStatusCodes } from '../utils/helpers/index.js';
import {
  EventSchema,
  EventUpdateSchema,
} from '../utils/validators/schemas/zod/EventSchema.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';

class EventController {
  constructor() {
    this.service = new EventService();
  }

  async create(req, res) {
    const parsedData = EventSchema.parse(req.body);

    const data = await this.service.create(
      {
        ...parsedData,
        created_by: req.user_id,
      },
      req.body,
    );

    return CommonResponse.created(res, data);
  }

  async list(req, res) {
    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async update(req, res) {
    const { id } = req.params;
    objectIdSchema.parse(id);

    const parsedData = EventUpdateSchema.parse(req.body);
    const data = await this.service.update(id, parsedData, req.body);

    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Event updated successfully.',
    );
  }

  async delete(req, res) {
    const { id } = req.params;
    objectIdSchema.parse(id);

    const data = await this.service.delete(id);

    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Event deleted successfully.',
    );
  }
}

export default EventController;
