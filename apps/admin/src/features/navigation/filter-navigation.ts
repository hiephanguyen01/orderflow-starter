import { matchesPermissions } from '@/features/access-control/utils/permission';
import { CurrentAuthorization } from '@/features/auth/types/auth.types';

import { AdminNavigationGroup } from './admin-navigation';

export function filterNavigation(
  groups: AdminNavigationGroup[],
  authorization: CurrentAuthorization | null,
): AdminNavigationGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const requiredPermissions = item.requiredPermissions ?? [];

        return matchesPermissions(authorization, requiredPermissions, item.matchMode ?? 'ALL');
      }),
    }))
    .filter((group) => group.items.length > 0);
}
