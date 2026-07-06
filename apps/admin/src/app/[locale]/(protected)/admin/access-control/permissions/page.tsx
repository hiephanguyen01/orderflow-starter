import { RequirePermissions } from '@/features/access-control/components/require-permissions';

export default function PermissionsPage() {
  return <RequirePermissions permissions={['permissions.read']}>{null}</RequirePermissions>;
}
