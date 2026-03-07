import School from '../services/SchoolService.js';
import {
  SchoolSchema,
  SchoolUpdateSchema,
} from '../utils/validators/schemas/zod/SchoolSchema.js';
import {
  SchoolQuerySchema,
  SchoolIdSchema,
} from '../utils/validators/schemas/zod/querys/SchoolQuerySchema.js';
import {
  CommonResponse,
  HttpStatusCodes,
} from '../utils/helpers/index.js';

class SchoolController {
  constructor() {
    this.service = new School();
  }

  async create(req, res) {
    const parsedData = SchoolSchema.parse(req.body);
    const data = await this.service.create(parsedData, req);

    return CommonResponse.created(res, data);
  }

  async list(req, res) {
    const { id } = req.params || {};
    if (id) {
      SchoolIdSchema.parse(id);
    }

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      await SchoolQuerySchema.parseAsync(query);
    }

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

}
