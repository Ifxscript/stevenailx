import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import GalleryPage from './pages/GalleryPage';
import SocialsPage from './pages/SocialsPage';
import ScrollToTop from './components/ScrollToTop';
import { LandingPageProvider } from './context/LandingPageContext';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import BookingDrawer from './components/booking/BookingDrawer';
import LoginPage from './pages/admin/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/admin/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LandingPageProvider>
          <BookingProvider>
            <div className="app">
              <ScrollToTop />
              <Routes>
                {/* Main Site Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/socials" element={<SocialsPage />} />
                
                {/* Admin Dashboard Routes */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin/*" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>

              {/* Booking Drawer — always mounted at root */}
              <BookingDrawer />
            </div>
          </BookingProvider>
        </LandingPageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
