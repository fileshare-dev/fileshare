import { Navigate, useRoutes } from 'react-router-dom';

import DashboardLayout from './layouts/dashboard';
import LogoOnlyLayout from './layouts/LogoOnlyLayout';
import File from './pages/File';
import Share from './pages/Share';
import Login from './pages/Login';
import Download from './pages/Download';
import NotFound from './pages/Page404';
import Register from './pages/Register';
import Profile from './pages/Profile';

export default function Router() {
  return useRoutes([
    {
      path: '/dashboard',
      element: <DashboardLayout />,
      children: [
        { path: 'file', element: <File /> },
        { path: 'share', element: <Share /> },
        { path: 'profile', element: <Profile /> },
      ],
    },
    {
      path: '/',
      element: <LogoOnlyLayout />,
      children: [
        { path: '/', element: <Navigate to="/dashboard/share" /> },
        { path: 'login', element: <Login /> },
        { path: 'download/:link', element: <Download /> },
        { path: 'download/:link/:fileUid/raw', element: <Download /> },
        { path: 'register', element: <Register /> },
        { path: '404', element: <NotFound /> },
        { path: '*', element: <Navigate to="/404" /> },
      ],
    },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
