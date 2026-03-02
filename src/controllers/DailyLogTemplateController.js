import DailyLogTemplateService from '../services/DailyLogTemplateService.js';
import {
  DailyLogTemplateSchema,
  DailyLogTemplateUpdateSchema,
} from '../utils/validators/schemas/zod/DailyLogTemplateSchema.js'; // Fazer o schema em outra tarefa enventualmente
import {
  DailyLogTemplateQuerySchema,
  DailyLogTemplateIdSchema,
} from '../utils/validators/schemas/zod/querys/DailyLogTemplateQuerySchema.js';
import {
  CommonResponse,
  HttpStatusCodes,
} from '../utils/helpers/index.js';

class DailyLogTemplateController {
  constructor() {
    this.service = new DailyLogTemplateService();
  }

  async create(req, res) {
    const parsedData = DailyLogTemplateSchema.parse(req.body);
    const data = await this.service.create(parsedData, req);

    return CommonResponse.created(res, data);
  }

  async list(req, res) {
    const { id } = req.params || {};
    if (id) {
      DailyLogTemplateIdSchema.parse(id);
    }

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      await DailyLogTemplateQuerySchema.parseAsync(query);
    }

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async update(req, res) {
    const { id } = req.params;
    DailyLogTemplateIdSchema.parse(id);

    const parsedData = DailyLogTemplateUpdateSchema.parse(req.body);
    const data = await this.service.update(id, parsedData, req);

    return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Template updated successfully.');
  }

  async delete(req, res) {
    const { id } = req.params || {};
    DailyLogTemplateIdSchema.parse(id);

    const data = await this.service.delete(id, req);

    return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Template deleted successfully.');
  }
}

export default DailyLogTemplateController;