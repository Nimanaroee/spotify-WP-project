import { Navigate, Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ArtworkManagementPage from '../pages/ArtworkManagementPage'
import MainLayout from '../layouts/MainLayout'
import ManagePage from '../pages/ManagePage'
import UserProfilePage from '../pages/UserProfilePage'
import AdminLayout from '../layouts/AdminLayout'
import RoleGuard from './RoleGuard'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import TicketsPage from '../pages/admin/TicketsPage'
import TicketDetailPage from '../pages/admin/TicketDetailPage'
import VerificationDetailPage from '../pages/admin/VerificationDetailPage'
import AuditingPage from '../pages/admin/AuditingPage'
import SubscriptionAdminPage from '../pages/admin/SubscriptionAdminPage'
import NotificationsPage from '../pages/NotificationsPage'
import SettingsPage from '../pages/SettingsPage'
import PlaylistsPage from '../pages/PlaylistsPage'

// Phase 2 Extension Imports Addition: Section 8
import AlbumsPage from '../pages/AlbumsPage'
import AlbumDetailPage from '../pages/AlbumDetailPage'

export default function Router() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      
      <Route path={ROUTES.HOME} element={<HomePage />} />
      
      <Route
        path={ROUTES.PLAYLISTS}
        element={
          <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}>
            <PlaylistsPage />
          </RoleGuard>
        }
      />
      
      <Route
        path={ROUTES.ALBUMS}
        element={
          <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}>
            <AlbumsPage />
          </RoleGuard>
        }
      />
      
      <Route
        path={`${ROUTES.ALBUMS}/:albumId`}
        element={
          <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}>
            <AlbumDetailPage />
          </RoleGuard>
        }
      />
      
      <Route path={ROUTES.MANAGE} element={<ManagePage />} />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </RoleGuard>
        }
      />
      <Route path={ROUTES.USER_PROFILE} element={<UserProfilePage />} />
      <Route
        path={ROUTES.ARTIST_STUDIO}
        element={
          <RoleGuard allowedRoles={[ROLES.ARTIST]}>
            <MainLayout>
              <ArtworkManagementPage />
            </MainLayout>
          </RoleGuard>
        }
      />
      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <RoleGuard
            allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}
          >
            <MainLayout>
              <NotificationsPage />
            </MainLayout>
          </RoleGuard>
        }
      />

      <Route
        element={
          <RoleGuard allowedRoles={[ROLES.SUPPORT, ROLES.ADMIN]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_TICKETS} replace />} />
        <Route path={ROUTES.ADMIN_TICKETS} element={<TicketsPage />} />
        <Route path="/admin/tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="/admin/verification/:requestId" element={<VerificationDetailPage />} />
        <Route path={ROUTES.ADMIN_AUDITING} element={<AuditingPage />} />
        <Route
          path={ROUTES.ADMIN_SUBSCRIPTIONS}
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <SubscriptionAdminPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}