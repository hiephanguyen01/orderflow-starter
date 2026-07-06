-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "after",
DROP COLUMN "before",
ADD COLUMN     "after_data" JSONB,
ADD COLUMN     "before_data" JSONB,
ALTER COLUMN "action" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "resource_type" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "resource_id" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "request_id" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "ip_address" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "user_agent" SET DATA TYPE VARCHAR(500);

-- Existing sessions predate refresh-token rotation tracking; safe to invalidate rather than backfill.
DELETE FROM "auth_sessions";

-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN     "current_refresh_token_id" UUID NOT NULL,
ADD COLUMN     "revoke_reason" VARCHAR(100),
ALTER COLUMN "ip_address" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "user_agent" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "code" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "module" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "code" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "display_name" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "auth_sessions_revoked_at_idx" ON "auth_sessions"("revoked_at");

-- CreateIndex
CREATE INDEX "role_permissions_assigned_by_id_idx" ON "role_permissions"("assigned_by_id");

-- CreateIndex
CREATE INDEX "user_permissions_assigned_by_id_idx" ON "user_permissions"("assigned_by_id");

-- CreateIndex
CREATE INDEX "user_roles_assigned_by_id_idx" ON "user_roles"("assigned_by_id");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");
