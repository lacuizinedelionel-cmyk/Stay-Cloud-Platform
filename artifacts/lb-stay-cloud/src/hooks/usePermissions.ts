import { useAuth } from '@/context/AuthContext';

export type AppRole = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF';

const ROLE_HIERARCHY: Record<AppRole, number> = {
  SUPER_ADMIN: 4,
  OWNER:       3,
  MANAGER:     2,
  STAFF:       1,
};

export function usePermissions() {
  const { user } = useAuth();
  const role = (user?.role ?? 'STAFF') as AppRole;
  const level = ROLE_HIERARCHY[role] ?? 1;

  return {
    role,
    level,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isOwner:      level >= 3,
    isManager:    level >= 2,
    isStaff:      level >= 1,
    canViewFinancials:  level >= 2,
    canViewAudit:       level >= 2,
    canManageRoles:     level >= 3,
    canViewBilling:     level >= 3,
    hasMinRole: (min: AppRole) => level >= (ROLE_HIERARCHY[min] ?? 1),
  };
}
