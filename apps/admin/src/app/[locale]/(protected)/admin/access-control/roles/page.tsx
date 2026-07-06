import { RequirePermissions } from '@/features/access-control/components/require-permissions';

export default function RolesPage() {
  return <RequirePermissions permissions={['roles.read']}>{null}</RequirePermissions>;
}
