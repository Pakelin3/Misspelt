import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from '@/utils/PrivatesRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from "@/components/ui/Sonner";
import HomePage from '@/views/HomePage';
import DictionaryPage from '@/views/DictionaryPage';
import RegisterPage from '@/views/RegisterPage';
import LoginPage from '@/views/LoginPage';
import Dashboard from '@/views/Dashboard';
import ProfilePage from '@/views/ProfilePage';
import Navbar from '@/components/Navbar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import EmailVerificationLandingPage from '@/views/EmailVerificationLandingPage';
import CheckEmailPage from '@/views/CheckEmailPage';
import BadgesPage from '@/views/BadgesPage';
import QuizPage from '@/views/QuizPage';
import GamePage from './views/GamePage';
import "./index.css";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* // ! Rutas públicas 
            */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/verify-email/:token" element={<EmailVerificationLandingPage />} />

            {/* // ! Rutas privadas 
            */}
            <Route element={<PrivateRoute requiredVerified={true} requiredStaff={false} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dictionary" element={<DictionaryPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/play" element={<GamePage />} />
              <Route path="/badges" element={<BadgesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* // ! Rutas admin/staff 
            */}
            <Route element={<PrivateRoute requiredVerified={true} requiredStaff={true} />}>
              <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
            </Route>
          </Routes>
          <Toaster
            toastOptions={{
              className: 'bg-card text-foreground pixel-border rounded-none font-mono border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;