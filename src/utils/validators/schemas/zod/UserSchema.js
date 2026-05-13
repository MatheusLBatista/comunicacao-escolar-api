import { z } from 'zod';

const passwordRegex =
  /^(?=.*[?@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-zA-Z])[?@!#$%^&*()/\\a-zA-Z0-9]+$/;

const MembershipSchema = z.object({
  school_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'school_id inválido'),
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

const UserUpdateSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Campo full_name é obrigatório.')
      .max(100, 'O nome deve ter no máximo 100 caracteres.')
      .optional(),
    active: z.boolean().optional(),
    memberships: z.array(MembershipSchema).optional(),
  })
  .partial();

const RegisterSchema = z.object({
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
});

const StudentInputSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Campo full_name do aluno é obrigatório.')
    .max(100, 'O nome do aluno deve ter no máximo 100 caracteres.'),
  class_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'class_id inválido'),
});

const LinkToSchoolSchema = z
  .object({
    user_id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'user_id inválido')
      .optional(),
    email: z.string().email('Formato de email inválido.').optional(),
    role: z.enum(['teacher', 'parent'], {
      errorMap: () => ({
        message: "Role deve ser 'teacher' ou 'parent'.",
      }),
    }),
    student: StudentInputSchema.optional(),
  })
  .refine((data) => data.user_id || data.email, {
    message: 'Informe user_id ou email do usuário a ser vinculado.',
    path: ['user_id'],
  })
  .refine((data) => data.role !== 'parent' || data.student, {
    message:
      'Ao vincular um responsável, é obrigatório informar os dados do aluno (campo student).',
    path: ['student'],
  });

const MeUpdateSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Campo full_name é obrigatório.')
      .max(100, 'O nome deve ter no máximo 100 caracteres.')
      .optional(),
    email: z.string().email('Formato de email inválido.').optional(),
  })
  .partial();

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória.'),
  new_password: z
    .string()
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .refine((val) => passwordRegex.test(val), {
      message:
        'A nova senha deve conter pelo menos 1 letra, 1 número e 1 caractere especial.',
    }),
});

const UpdateMembershipRoleSchema = z.object({
  role: z.enum(['teacher', 'parent', 'student'], {
    errorMap: () => ({
      message: "Role deve ser 'teacher', 'parent' ou 'student'.",
    }),
  }),
});

const FcmTokenSchema = z.object({
  fcm_token: z.string().min(1, 'O token FCM é obrigatório.'),
});

const ResetPasswordByCodeSchema = z.object({
  password_recovery_code: z
    .string()
    .min(1, 'Código de recuperação é obrigatório.'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .refine((val) => passwordRegex.test(val), {
      message:
        'A senha deve conter pelo menos 1 letra, 1 número e 1 caractere especial.',
    }),
});

const MoveStudentClassSchema = z.object({
  class_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'class_id inválido'),
});

export {
  UserSchema,
  AdminCreateSchema,
  UserUpdateSchema,
  MembershipSchema,
  RegisterSchema,
  StudentInputSchema,
  LinkToSchoolSchema,
  MeUpdateSchema,
  ChangePasswordSchema,
  FcmTokenSchema,
  UpdateMembershipRoleSchema,
  ResetPasswordByCodeSchema,
  MoveStudentClassSchema,
};
