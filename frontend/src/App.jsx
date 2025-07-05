// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './utils/PrivatesRoutes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './views/HomePage';
import DictionaryPage from './views/DictionaryPage';
import RegisterPage from './views/RegisterPage';
import LoginPage from './views/LoginPage';
import Dashboard from './views/Dashboard';
import ProfilePage from './views/ProfilePage';
import Navbar from './components/Navbar';
import AdminDashboard from './views/AdminDashboard';
import EmailVerificationLandingPage from './views/EmailVerificationLandingPage';
import CheckEmailPage from './views/CheckEmailPage';
import BadgesPage from './views/BadgesPage';
import SidebarIA from './components/SidebarIA';
import MainContent from './components/MainContent';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import "./styles/Globals.css";


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <StyleSheetManager shouldForwardProp={isPropValid}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />

            <Routes>
              {/* 
            // ! Rutas públicas 
            */}
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/check-email" element={<CheckEmailPage />} />
              <Route path="/verify-email/:token" element={<EmailVerificationLandingPage />} />

              {/* 
            // ! Rutas privadas 
            */}
              <Route element={<PrivateRoute requiredVerified={true} requiredStaff={false} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/ia" element={
                  <div className="flex h-[calc(100vh-76px)] relative bg-[#1e1e1e] text-gray-100">
                    <SidebarIA isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    <MainContent isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                  </div>
                } />
                <Route path="/play" element={<div>Jugar Page</div>} />
                <Route path="/badges" element={<BadgesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* 
            // ! Rutas admin/staff 
            */}
              <Route element={<PrivateRoute requiredVerified={true} requiredStaff={true} />}>
                <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </StyleSheetManager>
  );
}

export default App;