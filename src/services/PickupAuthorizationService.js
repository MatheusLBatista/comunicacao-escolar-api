import PickupAuthorizationRepository from '../repositories/PickupAuthorizationRepository.js';

class PickupAuthorizationService {
  constructor() {
    this.repository = new PickupAuthorizationRepository();
  }

  async list(req) {
    return this.repository.list(req);
  }
}

export default PickupAuthorizationService;
