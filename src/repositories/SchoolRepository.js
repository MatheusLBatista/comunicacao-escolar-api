import School from '../models/School.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class SchoolRepository {
  constructor(SchoolModel = School) {
    this.model = SchoolModel
  }

  async list(req) {
    const { id } = req.params || null;

    if(id) {
      const data = await this.model.findById(id);

      if(!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field:'School',
          details: [],
          customMessage: messages.error.resourceNotFound('School')
        })
      }

      const dataWithStats = {
        ...data.toObject(),
      };

      return dataWithStats;
    }

    const data = await this.model.find();
    return data;
  }

  async findByName(name, ignoredId=null) {
    const filter = { name };

    if(ignoredId) {
      filter._id = { $ne: ignoredId };
    }
    const document = await this.model.findOne(filter);

    return document;
  }
}

export default SchoolRepository;
