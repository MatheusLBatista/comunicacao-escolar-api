import ClassService from "../services/ClassService.js"
import CommonResponse from "../utils/helpers/CommonResponse.js"
import { ClassSchemaInput } from "../utils/validators/schemas/zod/ClassSchema.js"
import ObjectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js"
import { ClassQuerySchema } from "../utils/validators/schemas/zod/querys/ClassQuerySchema.js"

class ClassController {
    constructor() {
        this.service = new ClassService()
    }

    async list(req, res) {

        const { id } = req.params

        const { schoolId } = req.params

        ObjectIdSchema.parse(schoolId)

        if (id) {
            ObjectIdSchema.parse(id)
        }

        const query = req.query || {};

        if (Object.keys(query).length !== 0) {
            await ClassQuerySchema.safeParseAsync(query);
        }

        const data = await this.service.list(req)

        return CommonResponse.success(res, data, 200)
    }

    async create(req, res) {
        const body = req.body

        const { schoolId } = req.params

        const parsedData = ClassSchemaInput.parse(body)

        ObjectIdSchema.parse(schoolId)

        const data = await this.service.create(parsedData, schoolId)

        return CommonResponse.success(res, data, 201)
    }

    async update(req, res) {
        const body = req.body

        const { schoolId } = req.params

        const {id} = req.params

        ObjectIdSchema.parse(schoolId)

        ObjectIdSchema.parse(id)

        const parsedData = ClassSchemaInput.parse(body)

        const data = await this.service.update(parsedData, schoolId, id)

        return CommonResponse.success(res, data, 200)
    }
}

export default ClassController