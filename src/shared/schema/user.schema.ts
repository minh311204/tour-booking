import { z } from 'zod'

/** Đăng ký công khai — luôn tạo USER (không cho client chọn ADMIN). */
export const RegisterPublicSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export type RegisterPublicRequest = z.infer<typeof RegisterPublicSchema>

/** @deprecated dùng RegisterPublicSchema cho API register */
export const CreateUserSchema = RegisterPublicSchema

export type CreateUserRequest = z.infer<typeof CreateUserSchema>


export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']).optional()
})

export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>

export const UserResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
  role: z.enum(['ADMIN', 'USER']),
  hasPassword: z.boolean(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>

// auth 
export const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
  rememberMe: z.boolean().optional()
})

export type LoginRequest = z.infer<typeof LoginSchema>

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8),
})

export const OAuthGoogleSchema = z.object({
  idToken: z.string().min(1),
})

export const OAuthFacebookSchema = z.object({
  accessToken: z.string().min(1),
})

