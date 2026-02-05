import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
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
    const { signed, loading } = useAuth();
    const { hasPermission, hasRole } = usePermissions();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

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
