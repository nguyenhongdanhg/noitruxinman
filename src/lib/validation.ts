import { z } from 'zod';

// Vietnamese phone number regex (10 digits starting with 0)
const vietnamesePhoneRegex = /^0[0-9]{9}$/;

// Name validation: 2-100 characters, Unicode letters, spaces, hyphens, apostrophes
const nameRegex = /^[\p{L}\s'-]+$/u;

export const phoneSchema = z.string()
  .regex(vietnamesePhoneRegex, { message: 'Số điện thoại phải có 10 số, bắt đầu bằng 0' })
  .optional()
  .nullable()
  .or(z.literal(''));

export const fullNameSchema = z.string()
  .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  .max(100, { message: 'Họ tên không được quá 100 ký tự' })
  .regex(nameRegex, { message: 'Họ tên chỉ được chứa chữ cái' });

export const emailSchema = z.string()
  .email({ message: 'Email không hợp lệ' })
  .max(255, { message: 'Email không được quá 255 ký tự' });

export const passwordSchema = z.string()
  .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  .max(100, { message: 'Mật khẩu không được quá 100 ký tự' });

export const usernameSchema = z.string()
  .min(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  .max(50, { message: 'Tên đăng nhập không được quá 50 ký tự' })
  .regex(/^[a-zA-Z0-9_]+$/, { message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới' })
  .optional()
  .nullable()
  .or(z.literal(''));

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
  username: usernameSchema,
});

export const userCreationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
  classId: z.string().optional().nullable(),
});

// Validation helper functions
export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone || phone.trim() === '') return true;
  return vietnamesePhoneRegex.test(phone.trim());
}

export function validateName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 100) return false;
  return nameRegex.test(name.trim());
}

export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

// CSV injection protection - escape formulas
export function sanitizeCSVField(value: string): string {
  if (!value) return value;
  // Prevent CSV injection by escaping formulas
  if (value.match(/^[=+\-@\t\r]/)) {
    return "'" + value;
  }
  return value;
}
