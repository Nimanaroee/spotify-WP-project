import { Navigate, Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import RoleLandingPage from '../pages/RoleLandingPage'
import ListenerManagementPage from '../pages/ListenerManagementPage'
import { ROUTES } from '../lib/constants/routes'
import UserProfilePage from '../pages/UserProfilePage'

export default function Router() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.MANAGE} element={<ListenerManagementPage />} />
      <Route path={ROUTES.USER_PROFILE} element={<UserProfilePage />} />
      <Route path={ROUTES.ARTIST_STUDIO} element={<RoleLandingPage title="Artist Studio" />} />
      <Route path={ROUTES.ADMIN} element={<RoleLandingPage title="Admin Dashboard" />} />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
