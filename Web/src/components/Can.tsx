import React, { ReactNode } from 'react';
import { usePermissions } from '../features/auth/hooks/usePermissions';
import { Permission } from '../types/permissions';

interface CanProps {
    children: ReactNode;
    permissions?: Permission | Permission[];
    roles?: string | string[];
}

export const Can: React.FC<CanProps> = ({ children, permissions, roles }) => {
    const { hasPermission, hasRole } = usePermissions();

    let isAuthorized = true;

    if (permissions) {
        isAuthorized = hasPermission(permissions);
    }

    if (isAuthorized && roles) {
        isAuthorized = hasRole(roles);
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
};
