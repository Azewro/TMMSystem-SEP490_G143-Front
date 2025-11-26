import React from 'react';

import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();

    // Get token and user info from storage
    const token = sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

    // 1. Check Authentication
    if (!token) {
        // Redirect to login with returnUrl
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/internal-login?returnUrl=${returnUrl}`} replace />;
    }

    // 2. Check Authorization (if roles are specified)
    if (allowedRoles.length > 0 && userRole) {
        try {
            // Normalize role from storage
            const normalizedUserRole = userRole.toUpperCase();

            // Check if user has any of the allowed roles
            const hasPermission = allowedRoles.some(role => {
                const normalizedAllowedRole = role.toUpperCase().replace(/_/g, ' ');
                const currentRole = normalizedUserRole.replace(/_/g, ' ');
                return currentRole.includes(normalizedAllowedRole);
            });

            if (!hasPermission) {
                return <Navigate to="/unauthorized" replace />;
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            return <Navigate to="/internal-login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
