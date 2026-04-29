import { ClassSchema } from "../ClassSchema.js";

export const ClassQuerySchema = ClassSchema.omit({id:true, school_id:true}).partial()