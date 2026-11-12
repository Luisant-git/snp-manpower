import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NoticeBar from './components/NoticeBar.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import TrackCard from './components/TrackCard.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import ManageApplications from './pages/admin/ManageApplications.jsx';
import BranchMaster from './pages/admin/BranchMaster.jsx';
import FeeMaster from './pages/admin/FeeMaster.jsx';
import HiringJobBoard from './pages/admin/HiringJobBoard.jsx';
import AvailableJobs from './pages/AvailableJobs.jsx';

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-shell">
      {!isLoginPage && <NoticeBar />}
      {!isLoginPage && <Navbar />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/track"
            element={
              <div className="container" style={{ maxWidth: 520, margin: '48px auto 64px', padding: '0 16px' }}>
                <TrackCard />
              </div>
            }
          />
          <Route path="/my-submissions" element={<div className="container my-submissions-wide"><ManageApplications mySubmissions /></div>} />
          <Route path="/my-submissions/:ref" element={<Register readOnly />} />
          <Route path="/my-submissions/:ref/edit" element={<Register editable />} />
          <Route path="/available-jobs" element={<AvailableJobs />} />

          {/* Admin area — shared layout with sub navigation */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="branches" element={<BranchMaster />} />
            <Route path="fee-master" element={<FeeMaster />} />
            <Route path="hiring-jobs" element={<HiringJobBoard />} />
            <Route path="applications" element={<ManageApplications />} />
            <Route path="application/:ref" element={<Register readOnly />} />
            <Route path="application/:ref/edit" element={<Register editable />} />
          </Route>

          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
}
