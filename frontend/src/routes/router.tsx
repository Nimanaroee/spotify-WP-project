import { Navigate, Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import RoleLandingPage from '../pages/RoleLandingPage'

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/artist/studio" element={<RoleLandingPage title="Artist Studio" />} />
      <Route path="/admin" element={<RoleLandingPage title="Admin Dashboard" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
