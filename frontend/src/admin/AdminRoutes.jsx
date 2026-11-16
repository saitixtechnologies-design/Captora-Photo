import { Navigate, Outlet, Route, Routes } from 'react-router'
import { useAdminAuth } from './useAdminAuth.js'
import AdminLayout from './AdminLayout.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminServices from '../pages/admin/AdminServices.jsx'
import AdminGallery from '../pages/admin/AdminGallery.jsx'
import AdminHome from '../pages/admin/AdminHome.jsx'
import AdminPortfolio from '../pages/admin/AdminPortfolio.jsx'
import AdminProfilePhoto from '../pages/admin/AdminProfilePhoto.jsx'
import AdminEnquiries from '../pages/admin/AdminEnquiries.jsx'
import AdminFeedback from '../pages/admin/AdminFeedback.jsx'
import AdminLogin from '../pages/admin/AdminLogin.jsx'
import AdminForgotPassword from '../pages/admin/AdminForgotPassword.jsx'
import AdminResetPassword from '../pages/admin/AdminResetPassword.jsx'
import './admin.css'

function ProtectedAdmin() {
  const { user, loading } = useAdminAuth()
  if (loading) return <div className="admin-loading"><span />Checking your session</div>
  if (!user) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="forgot-password" element={<AdminForgotPassword />} />
      <Route path="reset-password" element={<AdminResetPassword />} />
      <Route element={<ProtectedAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="home" element={<AdminHome />} />
          <Route path="portfolio" element={<AdminPortfolio />} />
          <Route path="profile-photo" element={<AdminProfilePhoto />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="feedback" element={<AdminFeedback />} />
        </Route>
      </Route>
    </Routes>
  )
}
