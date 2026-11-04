import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import NoticeBar from './components/NoticeBar.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import ManageApplications from './pages/admin/ManageApplications.jsx';
import BranchMaster from './pages/admin/BranchMaster.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <NoticeBar />
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-submissions" element={<ManageApplications mySubmissions />} />
          <Route path="/my-submissions/:ref" element={<Register readOnly />} />

          {/* Admin area — shared layout with sub navigation */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="branches" element={<BranchMaster />} />
            <Route path="applications" element={<ManageApplications />} />
            <Route path="application/:ref" element={<Register readOnly />} />
            <Route path="application/:ref/edit" element={<Register editable />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
