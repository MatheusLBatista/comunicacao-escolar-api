import Class from '../models/Class.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import ClassFilterBuilder from './filters/ClassFilterBuilder.js';

class ClassRepository {
  constructor({ classModel = Class } = {}) {
    this.model = classModel;
  }

  async list(req) {
    const id = req?.params?.id;
    const schoolId = req?.params?.schoolId;
    const populate = [
      { path: 'school_id', select: 'name tax_id active' },
      { path: 'teacher_ids', select: 'full_name email active' },
    ];

    if (id) {
      const data = await this.model
        .findOne({ _id: id, school_id: schoolId })
        .populate(populate);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Class',
          details: [],
          customMessage: messages.error.resourceNotFound('Class'),
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      name,
      shift,
      year,
      teacher_id,
      active,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);

    const filterBuilder = new ClassFilterBuilder()
      .withSchoolId(schoolId || '')
      .withName(name || '')
      .withShift(shift || '')
      .withYear(year)
      .withTeacherId(teacher_id || '')
      .withActive(active);

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { year: -1, name: 1 },
      populate,
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) =>
      typeof doc.toObject === 'function' ? doc.toObject() : doc,
    );

    return result;
  }

  async create(data) {
    const turma = await this.model.insertOne(data);
    console.log(turma);

    return turma;
  }

  async findById(id) {
    const data = await this.model.findOne({ _id: id, active: true });

    return data;
  }

  async existClass(school_id, name, shift, year) {
    const data = this.model.findOne({
      school_id: school_id,
      name: name,
      shift: shift,
      year: year,
      active: true,
    });

    return data;
  }

  async update(parsedData, id) {
    const populate = [
      { path: 'school_id', select: 'name tax_id active' },
      { path: 'teacher_ids', select: 'full_name email active' },
    ];

    const data = await this.model
      .findByIdAndUpdate(id, parsedData, { new: true, runValidators: true })
      .populate(populate);

    return data;
  }

  async delete(id) {
    const data = await this.model.findOneAndUpdate(
      { _id: id, active: true },
      { $set: { active: false } },
      { new: true },
    );
    console.log(data);
    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Class',
        details: [],
        customMessage: messages.error.resourceNotFound('Class'),
      });
    }
    return data;
  }
}

export default ClassRepository;
