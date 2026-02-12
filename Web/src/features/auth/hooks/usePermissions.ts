import { useAuth } from './useAuth';
import { Permission } from '../../../types/permissions';

export function usePermissions() {
    const { user } = useAuth();

    function hasPermission(permission: Permission | Permission[]): boolean {
        if (!user) return false;

        const requiredPermissions = Array.isArray(permission) ? permission : [permission];

        // Check if user has ALL required permissions
        return requiredPermissions.every(p => user.permissions.includes(p));
    }

    function hasAnyPermission(permissions: Permission[]): boolean {
        if (!user) return false;

        return permissions.some(p => user.permissions.includes(p));
    }

    function hasRole(role: string | string[]): boolean {
        if (!user) return false;

        const requiredRoles = Array.isArray(role) ? role : [role];
        return requiredRoles.some(r => user.roles.includes(r));
    }

    return { hasPermission, hasAnyPermission, hasRole };
}
