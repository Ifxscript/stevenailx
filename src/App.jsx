import { lazy, Suspense, useEffect } from 'react';
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
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ProtectedRoute from './components/admin/ProtectedRoute';
import ProtectedBlogRoute from './components/blog/ProtectedBlogRoute';

const LoginPage     = lazy(() => import('./pages/admin/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BlogEditorPage = lazy(() => import('./pages/BlogEditorPage'));

function App() {
  useEffect(() => {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    loader.classList.add('fade-out');
    const t = setTimeout(() => loader.remove(), 450);
    return () => clearTimeout(t);
  }, []);

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
                    <Suspense fallback={null}>
                      <BlogEditorPage />
                    </Suspense>
                  </ProtectedBlogRoute>
                } />

                {/* Admin Dashboard Routes */}
                <Route path="/admin/login" element={
                  <Suspense fallback={null}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/admin/*" element={
                  <ProtectedRoute>
                    <Suspense fallback={null}>
                      <AdminDashboard />
                    </Suspense>
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
