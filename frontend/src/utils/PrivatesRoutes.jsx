// src/utils/PrivatesRoutes.jsx (Updated)
import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '@/context/AuthContext';

const PrivateRoute = ({ requiredVerified = false, requiredStaff = false }) => {
    let { user, loading } = useContext(AuthContext);

    if (loading) {

        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (requiredVerified && !user.verified) {
        return <Navigate to="/check-email" replace />;
    }
    if (requiredStaff && !user.is_staff) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;