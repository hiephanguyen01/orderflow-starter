import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

import { permissionDefinitions } from 'src/database/prisma/seed-data.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { Prisma } from '../src/generated/prisma/client.js';

config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

const databaseUrl = requireEnvironment('DATABASE_URL');

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function seedPermissions() {
  const permissions = [];

  for (const definition of permissionDefinitions) {
    const permission = await prisma.permission.upsert({
      where: {
        code: definition.code,
      },

      create: {
        code: definition.code,
        name: definition.name,
        module: definition.module,
        description: definition.description,
        isSystem: definition.isSystem ?? true,
        isActive: true,
      },

      update: {
        name: definition.name,
        module: definition.module,
        description: definition.description,
        isSystem: definition.isSystem ?? true,
      },
    });

    permissions.push(permission);
  }

  return permissions;
}

async function seedSystemRoles() {
  const superAdminRole = await prisma.role.upsert({
    where: {
      code: 'SUPER_ADMIN',
    },

    create: {
      code: 'SUPER_ADMIN',
      name: 'Super Administrator',
      description: 'Protected role with unrestricted system access.',
      isSystem: true,
      isActive: true,
    },

    update: {
      name: 'Super Administrator',
      description: 'Protected role with unrestricted system access.',
      isSystem: true,
      isActive: true,
    },
  });

  const customerRole = await prisma.role.upsert({
    where: {
      code: 'CUSTOMER',
    },

    create: {
      code: 'CUSTOMER',
      name: 'Customer',
      description: 'Default role assigned to registered customers.',
      isSystem: true,
      isActive: true,
    },

    update: {
      name: 'Customer',
      description: 'Default role assigned to registered customers.',
      isSystem: true,
    },
  });

  return {
    superAdminRole,
    customerRole,
  };
}

async function assignSuperAdminPermissions(roleId: string, permissionIds: string[]): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.rolePermission.deleteMany({
      where: {
        roleId,
      },
    });

    await transaction.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),

      skipDuplicates: true,
    });
  });
}

async function seedInitialAdministrator(superAdminRoleId: string): Promise<void> {
  const email = requireEnvironment('INITIAL_ADMIN_EMAIL').toLowerCase();

  const password = requireEnvironment('INITIAL_ADMIN_PASSWORD');

  const displayName =
    process.env['INITIAL_ADMIN_DISPLAY_NAME']?.trim() || 'OrderFlow Administrator';

  if (password.length < 12) {
    throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters');
  }

  if (process.env['NODE_ENV'] === 'production' && password === 'ChangeThisPassword123!') {
    throw new Error('Default administrator password cannot be used in production');
  }

  let administrator = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!administrator) {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    administrator = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    console.info(`Created initial administrator: ${email}`);
  } else {
    console.info(`Initial administrator already exists: ${email}`);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: administrator.id,
        roleId: superAdminRoleId,
      },
    },

    create: {
      userId: administrator.id,
      roleId: superAdminRoleId,
    },

    update: {},
  });
}

async function createSeedAuditLog(metadata: Record<string, unknown>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: 'SYSTEM_SEED_COMPLETED',
      resourceType: 'SYSTEM',
      resourceId: 'identity-rbac',
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

async function main(): Promise<void> {
  console.info('Starting OrderFlow database seed...');

  const permissions = await seedPermissions();

  const { superAdminRole, customerRole } = await seedSystemRoles();

  await assignSuperAdminPermissions(
    superAdminRole.id,
    permissions.map((permission) => permission.id),
  );

  await seedInitialAdministrator(superAdminRole.id);

  await createSeedAuditLog({
    permissionCount: permissions.length,
    roles: [superAdminRole.code, customerRole.code],
  });

  console.info('OrderFlow database seed completed.');
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
