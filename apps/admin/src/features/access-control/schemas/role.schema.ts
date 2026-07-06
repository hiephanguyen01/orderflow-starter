import { z } from 'zod';

type RoleSchemaMessages = {
  codeRequired: string;
  codeInvalid: string;
  nameRequired: string;
  nameTooLong: string;
  descriptionTooLong: string;
};

export function createRoleSchema(messages: RoleSchemaMessages) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, messages.codeRequired)
      .max(100, messages.codeInvalid)
      .regex(/^[A-Z][A-Z0-9_]*$/, messages.codeInvalid),

    name: z.string().trim().min(2, messages.nameRequired).max(150, messages.nameTooLong),

    description: z.string().trim().max(500, messages.descriptionTooLong),

    isActive: z.boolean(),

    permissionIds: z.array(z.string().uuid()),
  });
}

export type RoleFormValues = z.infer<ReturnType<typeof createRoleSchema>>;
