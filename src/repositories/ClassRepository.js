import Class from '../models/Class.js';

class ClassRepository {
  constructor({ classModel = Class } = {}) {
    this.model = classModel;
  }

  async create(data) {
    const turma = await this.model.insertOne(data)
    console.log(turma)

    return turma
  }

  async findById(id) {
    const data = await this.model.findById(id);

    return data;
  }

  async existClass(school_id, name, grade) {
    const data = this.model.findOne({school_id:school_id, name:name, grade})

    return data
  }
}

export default ClassRepository;
