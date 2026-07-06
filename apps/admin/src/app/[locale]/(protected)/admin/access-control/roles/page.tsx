import { RequirePermissions } from '@/features/access-control/components/require-permissions';
import { RolesPageContent } from '@/features/access-control/components/roles-page-content';

export default function RolesPage() {
  return (
    <RequirePermissions permissions={['roles.read']}>
      <RolesPageContent />
    </RequirePermissions>
  );
}
