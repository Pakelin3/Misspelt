import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from '@/utils/PrivatesRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from "@/components/ui/Sonner";
import Navbar from '@/components/Navbar';
import ErrorBoundary from '@/components/ErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import LoadingScreen from '@/components/ui/LoadingScreen';
import HomePage from '@/views/HomePage';
import "./index.css";

/*
 * Solo la landing se importa de forma estatica: es la primera pantalla y su
 * coste ya esta pagado. Todo lo demas se carga cuando se visita.
 *
 * Antes las 13 vistas eran imports estaticos, asi que quien abria /login
 * descargaba tambien los seis paneles de administracion, Chart.js, GSAP,
 * driver.js y @dnd-kit en un unico chunk.
 */
const LoginPage = lazy(() => import('@/views/LoginPage'));
const RegisterPage = lazy(() => import('@/views/RegisterPage'));
const CheckEmailPage = lazy(() => import('@/views/CheckEmailPage'));
const EmailVerificationLandingPage = lazy(() => import('@/views/EmailVerificationLandingPage'));
const DictionaryPage = lazy(() => import('@/views/DictionaryPage'));
const QuizPage = lazy(() => import('@/views/QuizPage'));
const GamePage = lazy(() => import('@/views/GamePage'));
const BadgesPage = lazy(() => import('@/views/BadgesPage'));
const ProfilePage = lazy(() => import('@/views/ProfilePage'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const NotFoundPage = lazy(() => import('@/views/NotFoundPage'));

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ScrollToTop />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-loading-overlay focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-3 focus:font-mono focus:text-2xs focus:uppercase focus:no-underline focus:outline-none focus:ring-4 focus:ring-ring"
          >
            Saltar al contenido
          </a>
          <Navbar />
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
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

                {/* Cualquier otra URL: antes renderizaba una pantalla en blanco. */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
