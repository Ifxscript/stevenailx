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
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import BlogEditorPage from './pages/BlogEditorPage';
import ProtectedBlogRoute from './components/blog/ProtectedBlogRoute';

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
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                
                {/* Blog Editor Portal Route */}
                <Route path="/blog-editor" element={
                  <ProtectedBlogRoute>
                    <BlogEditorPage />
                  </ProtectedBlogRoute>
                } />
                
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
