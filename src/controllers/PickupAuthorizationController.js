import PickupAuthorizationService from '../services/PickupAuthorizationService.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import { CommonResponse } from '../utils/helpers/index.js';

class PickupAuthorizationController {
  constructor() {
    this.service = new PickupAuthorizationService();
  }

  async list(req, res) {
    const { id } = req.params || {};

    if (id) {
      objectIdSchema.parse(id);
    }

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }
}

export default PickupAuthorizationController;
