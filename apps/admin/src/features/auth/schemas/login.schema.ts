import { z } from 'zod';

type LoginValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordTooLong: string;
};

export function createLoginSchema(messages: LoginValidationMessages) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid)
      .max(255, messages.emailInvalid),

    password: z.string().min(1, messages.passwordRequired).max(128, messages.passwordTooLong),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
