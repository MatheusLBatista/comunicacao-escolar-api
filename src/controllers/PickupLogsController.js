import PickupLogService from '../services/PickupLogService.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import {
  PickupLogSchema,
  PickupLogUpdateSchema,
} from '../utils/validators/schemas/zod/PickupLogSchema.js';
import { CommonResponse, HttpStatusCodes } from '../utils/helpers/index.js';

class PickupLogsController {
  constructor() {
    this.service = new PickupLogService();
  }

  async create(req, res) {
    const parsedData = PickupLogSchema.parse(req.body);
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

  async update(req, res) {
    const { id } = req.params;
    objectIdSchema.parse(id);

    const parsedData = PickupLogUpdateSchema.parse(req.body);
    const data = await this.service.update(id, parsedData);

    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Pickup log updated successfully.',
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
      'Pickup log deleted successfully.',
    );
  }
}

export default PickupLogsController;
