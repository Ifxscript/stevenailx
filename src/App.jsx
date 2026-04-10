import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import GalleryPage from './pages/GalleryPage';
import SocialsPage from './pages/SocialsPage';
import ScrollToTop from './components/ScrollToTop';
import { LandingPageProvider } from './context/LandingPageContext';

function App() {
  return (
    <LandingPageProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/socials" element={<SocialsPage />} />
        </Routes>
      </Router>
    </LandingPageProvider>
  );
}

export default App;
