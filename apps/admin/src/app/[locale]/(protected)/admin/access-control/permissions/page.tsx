import { RequirePermissions } from '@/features/access-control/components/require-permissions';
import { PermissionsPageContent } from '@/features/access-control/components/permissions-page-content';

export default function PermissionsPage() {
  return (
    <RequirePermissions permissions={['permissions.read']}>
      <PermissionsPageContent />
    </RequirePermissions>
  );
}
