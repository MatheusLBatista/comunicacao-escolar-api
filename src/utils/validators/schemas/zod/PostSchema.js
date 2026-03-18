import {z} from 'zod'

export const PostSchema = z.object({
    id: z.string().uuid({message:"ID do anúncio com formato inválido."}),
    school_id: z.string().uuid({message:"ID da escola com formato inválido."}),
    author_id:z.string().uuid({message:"ID do autor com formato inválido."}),
    title: z.string({message:"O título não é uma string válida."}),
    content: z.string({message:"O conteúdo não é uma string válida."}),
    target:Target,
    attachments: z.string({message:"O attachments não é uma string válida."}).array(),
    active:z.boolean().default(true)
})



const Target = z.object({
    target_id:z.string().uuid({message:"ID do target com formato inválido."}),
    scope: z.string({message:"O scope não é uma string válida."}).default("all")
})