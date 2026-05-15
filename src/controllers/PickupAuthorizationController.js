import PickupAuthorizationService from '../services/PickupAuthorizationService.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import {
  PickupAuthorizationSchema,
  PickupAuthorizationUpdateSchema,
} from '../utils/validators/schemas/zod/PickupAuthorizationSchema.js';
import { CommonResponse, HttpStatusCodes } from '../utils/helpers/index.js';

class PickupAuthorizationController {
  constructor() {
    this.service = new PickupAuthorizationService();
  }

  async create(req, res) {
    const parsedData = PickupAuthorizationSchema.parse(req.body);
    const data = await this.service.create(parsedData, req);

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

  async update(req, res) {
    const { id } = req.params;
    objectIdSchema.parse(id);

    const parsedData = PickupAuthorizationUpdateSchema.parse(req.body);
    const data = await this.service.update(id, parsedData);

    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Pickup authorization updated successfully.',
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
      'Pickup authorization deleted successfully.',
    );
  }
}

export default PickupAuthorizationController;
