import { z } from "zod";

export const ClassSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
        message: "ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)",
    }).optional(),
    active: z.coerce.boolean({message: "Active deve ser um boolean"}).default(true),
    school_id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
        message: "ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)",
    }),
    name: z.string().nonempty({message: "O nome da classe não pode ser vazio"}).max(50, {message: "O limite do nome é de no máximo 50 caracteres."}),
    shift: z.string().nonempty({message: "O turno (shift) não pode ser vazio."}).max(50, {message: "O limite do turno é de no máximo 50 caracteres."}),
    year: z.coerce.number({invalid_type_error: "O ano deve ser um número válido."}).int({message: "O ano deve ser um número inteiro."}).min(1900, {message: "O ano fornecido é inválido."}),
    teacher_ids: z.array(
        z.string().regex(/^[0-9a-fA-F]{24}$/, {
            message: "O id do professor deve ser um MongoDB ObjectId de 24 caracteres hexadecimais"
        })
    ).min(0).default([]),
    metadata: z.string().optional()
});

export const ClassSchemaInput = ClassSchema.omit({id:true, school_id:true, active:true}).partial()