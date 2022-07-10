import UserAPI from '../services/UserAPI';
import React from "react";
import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
    return UserAPI.isLoggedIn() ? <Outlet /> : <Navigate to="/login" />;
}
