import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../types/permissions';

interface ProtectedRouteProps {
    children: ReactNode;
    permissions?: Permission | Permission[];
    roles?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    permissions,
    roles
}) => {
    const { signed } = useAuth();
    const { hasPermission, hasRole } = usePermissions();
    const location = useLocation();

    if (!signed) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    let isAuthorized = true;

    if (permissions) {
        isAuthorized = hasPermission(permissions);
    }

    if (isAuthorized && roles) {
        isAuthorized = hasRole(roles);
    }

    if (!isAuthorized) {
        // Redirect to unauthorized page or dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
