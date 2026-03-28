import EventRepository from '../repositories/EventRepository.js';

class EventService {
  constructor() {
    this.repository = new EventRepository();
  }

  async list(req) {
    const data = await this.repository.list(req);

    return data;
  }
}

export default EventService;
