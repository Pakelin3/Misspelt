import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './utils/PrivatesRoutes';
import { AuthProvider } from './context/AuthContext';
import HomePage from './views/HomePage';
import DictionaryPage from './views/DictionaryPage';
import RegisterPage from './views/RegisterPage';
import LoginPage from './views/LoginPage';
import Dashboard from './views/Dashboard';
import Navbar from './components/Navbar';
import AdminDashboard from './views/AdminDashboard';
import EmailVerificationLandingPage from './views/EmailVerificationLandingPage';
import CheckEmailPage from './views/CheckEmailPage';
import "./styles/Globals.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Rutas publicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/verify-email/:token" element={<EmailVerificationLandingPage />} />

          {/* Rutas privadas */}
          <Route element={<PrivateRoute requiredVerified={true} requiredStaff={false} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/play" element={<div>Jugar Page</div>} />
            <Route path="/ia" element={<div>IA Page</div>} />
            <Route path="/badges" element={<div>Insignias Page</div>} />
            <Route path="/profile" element={<div>perfil</div>} />
          </Route>

          {/* Rutas admin/staff */}
          <Route element={<PrivateRoute requiredVerified={true} requiredStaff={true} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App; 