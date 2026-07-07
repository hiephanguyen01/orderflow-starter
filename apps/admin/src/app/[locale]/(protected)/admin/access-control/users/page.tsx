import { RequirePermissions } from '@/features/access-control/components/require-permissions';
import { UsersPageContent } from '@/features/access-control/components/users-page-content';

export default function UsersPage() {
  return (
    <RequirePermissions permissions={['users.read']}>
      <UsersPageContent />
    </RequirePermissions>
  );
}
