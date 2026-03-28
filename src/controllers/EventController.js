import EventService from '../services/EventService.js';
import { CommonResponse } from '../utils/helpers/index.js';

class EventController {
  constructor() {
    this.service = new EventService();
  }

  async list(req, res) {
    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }
}

export default EventController;
