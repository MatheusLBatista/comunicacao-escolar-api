import DailyLogService from '../services/DailyLogService.js';
import {
  DailyLogSchema,
  DailyLogUpdateSchema,
} from '../utils/validators/schemas/zod/DailyLogSchema.js'; // Fazer o schema em outra tarefa enventualmente
import {
  DailyLogQuerySchema,
  DailyLogIdSchema,
} from '../utils/validators/schemas/zod/querys/DailyLogQuerySchema.js';
import {
  CommonResponse,
  HttpStatusCodes,
} from '../utils/helpers/index.js';

class DailyLogController {
  constructor() {
    this.service = new DailyLogService();
  }

  async create(req, res) {
    const parsedData = DailyLogSchema.parse(req.body);
    const data = await this.service.create(parsedData, req);

    return CommonResponse.created(res, data);
  }

  async list(req, res) {
    const { id } = req.params || {};
    if (id) {
      DailyLogIdSchema.parse(id);
    }

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      await DailyLogQuerySchema.parseAsync(query);
    }

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async update(req, res) {
    const { id } = req.params;
    DailyLogIdSchema.parse(id);

    const parsedData = DailyLogUpdateSchema.parse(req.body);
    const data = await this.service.update(id, parsedData, req);

    return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Daily log updated successfully.');
  }

  async delete(req, res) {
    const { id } = req.params || {};
    DailyLogIdSchema.parse(id);

    const data = await this.service.delete(id, req);

    return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Daily log deleted successfully.');
  }

  async markAsRead(req, res) {
    const { id } = req.params;
    DailyLogIdSchema.parse(id);

    const data = await this.service.markAsRead(id, req);
    return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Daily log marked as read.');
  }
}

export default DailyLogController;