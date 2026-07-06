import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { config } from 'dotenv';

import { PrismaClient } from '../src/generated/prisma/client.js';

config({ path: '../../.env' });
config();

const permissionDefinitions = [
  { code: 'system.super-admin', name: 'Super administrator', module: 'system' },
  { code: 'roles.read', name: 'Xem vai trò', module: 'access-control' },
  { code: 'roles.create', name: 'Tạo vai trò', module: 'access-control' },
  { code: 'roles.update', name: 'Cập nhật vai trò', module: 'access-control' },
  { code: 'roles.delete', name: 'Xóa vai trò', module: 'access-control' },
  { code: 'roles.assign', name: 'Gán vai trò', module: 'access-control' },
  { code: 'permissions.read', name: 'Xem quyền', module: 'access-control' },
  { code: 'permissions.create', name: 'Tạo quyền', module: 'access-control' },
  { code: 'permissions.update', name: 'Cập nhật quyền', module: 'access-control' },
  { code: 'permissions.delete', name: 'Xóa quyền', module: 'access-control' },
  { code: 'permissions.assign', name: 'Gán quyền', module: 'access-control' },
  { code: 'users.read', name: 'Xem người dùng', module: 'users' },
  { code: 'users.manage-access', name: 'Quản lý quyền người dùng', module: 'users' },
  { code: 'audit-logs.read', name: 'Xem audit log', module: 'audit' },
] as const;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

async function main(): Promise<void> {
  for (const definition of permissionDefinitions) {
    await prisma.permission.upsert({
      where: {
        code: definition.code,
      },
      update: {
        name: definition.name,
        module: definition.module,
        isSystem: true,
        isActive: true,
      },
      create: {
        ...definition,
        isSystem: true,
        isActive: true,
      },
    });
  }

  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: {
      code: 'SUPER_ADMIN',
    },
    update: {
      name: 'Super administrator',
      isSystem: true,
      isActive: true,
    },
    create: {
      code: 'SUPER_ADMIN',
      name: 'Super administrator',
      isSystem: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map(({ id }) => ({
      roleId: superAdminRole.id,
      permissionId: id,
    })),
    skipDuplicates: true,
  });

  await prisma.role.upsert({
    where: {
      code: 'CUSTOMER',
    },
    update: {
      name: 'Customer',
      isSystem: true,
      isActive: true,
    },
    create: {
      code: 'CUSTOMER',
      name: 'Customer',
      isSystem: true,
      isActive: true,
    },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      passwordHash,
      displayName: process.env.SEED_ADMIN_DISPLAY_NAME?.trim() || 'Super Admin',
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail,
      passwordHash,
      displayName: process.env.SEED_ADMIN_DISPLAY_NAME?.trim() || 'Super Admin',
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  await prisma.userRole.createMany({
    data: [
      {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    ],
    skipDuplicates: true,
  });
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
