import ClassRepository from "../repositories/ClassRepository.js";
import SchoolRepository from "../repositories/SchoolRepository.js";
import { CustomError, HttpStatusCodes } from "../utils/helpers/index.js";

class ClassService {
    constructor() {
        this.repository = new ClassRepository()
        this.schoolRepository = new SchoolRepository()
    }

    async create(parsedData, schoolId) {
        const { name, grade } = parsedData;
        
        const school = await this.schoolRepository.findById(schoolId)
        
        if(!school) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'school_id',
                details: [
                    { 
                        path: 'school_id', 
                        message: 'A escola informada não foi encontrada no banco de dados.' 
                    },
                ],
                customMessage: 'Escola não encontrada para criar a turma.',
            });
        }
        // Adicionei o "await" aqui, pois a consulta de repositório deve ser assíncrona
        
        const classExists = await this.repository.existClass(schoolId, name, grade);

        if (classExists) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'conflictError',
                field: 'class',
                details: [
                    { 
                        path: 'name', 
                        message: 'Já existe uma turma cadastrada com este nome e série/grau para a escola selecionada.' 
                    },
                ],
                customMessage: 'Conflito de registro: Uma turma com este nome e série/grau já existe nesta escola.',
            });
        }
        
        const data = await this.repository.create({...parsedData, school_id: schoolId});
        return data;
    }
}

export default ClassService;