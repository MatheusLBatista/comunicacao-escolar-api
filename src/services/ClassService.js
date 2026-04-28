import ClassRepository from "../repositories/ClassRepository.js";
import SchoolRepository from "../repositories/SchoolRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import { CustomError, HttpStatusCodes } from "../utils/helpers/index.js";

class ClassService {
    constructor() {
        this.repository = new ClassRepository()
        this.schoolRepository = new SchoolRepository()
        this.userRepository = new UserRepository()
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
        
        
        const profs = await this.userRepository.findUsers(parsedData.teacher_ids, 'teacher')
        if (profs.length !== parsedData.teacher_ids.length) {
            const foundTeacherIds = new Set(profs.map((prof) => String(prof._id)));
            const missingTeacherIds = parsedData.teacher_ids.filter(
                (teacherId) => !foundTeacherIds.has(String(teacherId)),
            );

            throw new CustomError({
                statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
                errorType: 'validationError',
                field: 'teacher_ids',
                details: [
                    {
                        path: 'teacher_ids',
                        message:
                            'Um ou mais IDs de professores são inválidos, não foram encontrados ou não possuem role teacher.',
                    },
                    {
                        path: 'teacher_ids',
                        message: `IDs inválidos/não encontrados: ${missingTeacherIds.join(', ')}`,
                    },
                ],
                customMessage:
                    'Não foi possível criar a turma: verifique os teacher_ids informados.',
            })
        }

        const data = await this.repository.create({...parsedData, school_id: schoolId});
        return data;
    }
}

export default ClassService;