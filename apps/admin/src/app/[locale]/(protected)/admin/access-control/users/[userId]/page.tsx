import { RequirePermissions } from '@/features/access-control/components/require-permissions';

export default function UserAccessPage() {
  return <RequirePermissions permissions={['users.read']}>{null}</RequirePermissions>;
}
