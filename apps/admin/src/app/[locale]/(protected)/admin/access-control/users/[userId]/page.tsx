import { RequirePermissions } from '@/features/access-control/components/require-permissions';
import { UserAccessPageContent } from '@/features/access-control/components/user-access-page-content';

type UserAccessPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserAccessPage({ params }: UserAccessPageProps) {
  const { userId } = await params;

  return (
    <RequirePermissions permissions={['users.read']}>
      <UserAccessPageContent userId={userId} />
    </RequirePermissions>
  );
}
