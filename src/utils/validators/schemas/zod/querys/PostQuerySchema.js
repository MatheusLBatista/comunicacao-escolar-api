import { z } from 'zod';
import mongoose from 'mongoose';
import { array } from 'zod/v4';

const target = z.object({
    scope: z.string(),
    target_id: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
            message: 'ID de shcool_id inválido',
        }).optional()
})

export const PostQuerySchema = z.object({
    school_id: z.string()
        .refine((id) => mongoose.Types.ObjectId.isValid(id), {
            message: 'ID de shcool_id inválido',
        }).optional(),
    author_id: z.string()
      .refine((id) => mongoose.Types.ObjectId.isValid(id), {
        message: 'ID de author_id inválido',
      }).optional(),
    title: z.string({message:"title não é uma string válida"}),
    content: z.string().optional(),
    target: target,
    attachments: z.preprocess(arg => {
        if(typeof arg === "string") {
            let array = arg.split(',')
            return array
        }
        return array
    }, z.array()).optional(),
    active: z.preprocess(arg => {
        if(arg == "true") {
            return true
        }
        if(arg == "false") {
            return false
        }
        return arg
    }, z.boolean({message:"Active não é um valor boolean válido"})).optional(),
    created_at: z.coerce.date({message:"Data inválida."}).optional()
})

