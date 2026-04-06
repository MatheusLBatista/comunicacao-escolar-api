import PickupAuthorizationService from '../services/PickupAuthorizationService.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import { PickupAuthorizationSchema } from '../utils/validators/schemas/zod/PickupAuthorizationSchema.js';
import { CommonResponse } from '../utils/helpers/index.js';

class PickupAuthorizationController {
  constructor() {
    this.service = new PickupAuthorizationService();
  }

  async create(req, res) {
    const parsedData = PickupAuthorizationSchema.parse(req.body);
    const data = await this.service.create(parsedData);

    return CommonResponse.created(res, data);
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
