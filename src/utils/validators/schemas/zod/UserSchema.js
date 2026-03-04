import { z } from 'zod';

const passwordRegex =
  /^(?=.*[?@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-zA-Z])[?@!#$%^&*()/\\a-zA-Z0-9]+$/;

const MembershipSchema = z.object({
  school_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'school_id inválido'),
  role: z.enum(['admin', 'teacher', 'parent', 'student']),
  class_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'class_id inválido').nullable().optional(),
  associated_students: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de aluno inválido'))
    .optional()
    .default([]),
});

const UserSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Campo full_name é obrigatório.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z
    .string()
    .email('Formato de email inválido.')
    .min(1, 'Campo email é obrigatório.'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .refine((val) => passwordRegex.test(val), {
      message:
        'A senha deve conter pelo menos 1 letra, 1 número e 1 caractere especial.',
    })
    .optional(),
  role: z.enum(['admin', 'teacher', 'parent', 'student']),
  class_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'class_id inválido')
    .nullable()
    .optional(),
  associated_students: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de aluno inválido'))
    .optional()
    .default([]),
  active: z.boolean().default(true),
});

const AdminCreateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Campo full_name é obrigatório.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z
    .string()
    .email('Formato de email inválido.')
    .min(1, 'Campo email é obrigatório.'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .refine((val) => passwordRegex.test(val), {
      message:
        'A senha deve conter pelo menos 1 letra, 1 número e 1 caractere especial.',
    }),
  active: z.boolean().default(true),
});

const UserUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Campo full_name é obrigatório.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .optional(),
  active: z.boolean().optional(),
  memberships: z.array(MembershipSchema).optional(),
}).partial();

export { UserSchema, AdminCreateSchema, UserUpdateSchema, MembershipSchema };
