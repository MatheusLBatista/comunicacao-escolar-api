import ClassService from "../services/ClassService.js"
import CommonResponse from "../utils/helpers/CommonResponse.js"
import { ClassSchemaInput } from "../utils/validators/schemas/zod/ClassSchema.js"
import ObjectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js"

class ClassController {
    constructor() {
        this.service = new ClassService()
    }
    async create(req, res) {
        const body = req.body

        const {schoolId} = req.params

        const parsedData = ClassSchemaInput.parse(body)

        ObjectIdSchema.parse(schoolId)

        const data = await this.service.create(parsedData, schoolId)

        return CommonResponse.success(res, data, 201)
    }
}

export default ClassController