import { RequirePermissions } from '@/features/access-control/components/require-permissions';

export default function UsersPage() {
  return <RequirePermissions permissions={['users.read']}>{null}</RequirePermissions>;
}
