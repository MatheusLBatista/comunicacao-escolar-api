import Class from '../models/Class.js';

class ClassRepository {
  constructor({ classModel = Class } = {}) {
    this.model = classModel;
  }

  async findById(id) {
    const data = await this.model.findById(id);

    return data;
  }
}

export default ClassRepository;
