import { z } from 'zod';

type PermissionSchemaMessages = {
  codeRequired: string;
  codeInvalid: string;
  nameRequired: string;
  nameTooLong: string;
  moduleRequired: string;
  moduleInvalid: string;
  descriptionTooLong: string;
};

export function createPermissionSchema(messages: PermissionSchemaMessages) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, messages.codeRequired)
      .max(150, messages.codeInvalid)
      .regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/, messages.codeInvalid),

    name: z.string().trim().min(2, messages.nameRequired).max(150, messages.nameTooLong),

    module: z
      .string()
      .trim()
      .min(1, messages.moduleRequired)
      .max(100, messages.moduleInvalid)
      .regex(/^[a-z][a-z0-9-]*$/, messages.moduleInvalid),

    description: z.string().trim().max(500, messages.descriptionTooLong),

    isActive: z.boolean(),
  });
}

export type PermissionFormValues = z.infer<ReturnType<typeof createPermissionSchema>>;
