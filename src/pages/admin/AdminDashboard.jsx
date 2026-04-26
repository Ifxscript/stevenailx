import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { useMobile } from '../../hooks/useMobile';
import { 
  BarChart3, Settings, Image as ImageIcon, ListOrdered, LogOut, 
  Home, ChevronRight, Menu, X, Star, Users, MessageSquare, CalendarCheck, Clock, Plus
} from 'lucide-react';
import ServicesManager from '../../components/admin/ServicesManager';
import ContentManager from '../../components/admin/ContentManager';
import PortfolioManager from '../../components/admin/PortfolioManager';
import ReviewsManager from '../../components/admin/ReviewsManager';
import TeamManager from '../../components/admin/TeamManager';
import BookingsManager from '../../components/admin/BookingsManager';
import AvailabilityManager from '../../components/admin/AvailabilityManager';
import UsersManager from '../../components/admin/UsersManager';
import SettingsPage from '../../components/admin/SettingsPage';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import './AdminDashboard.css';

function AdminDashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  const navItems = [
    { label: 'Overview', path: '/admin' },
    { label: 'Site Content', path: '/admin/content' },
    { label: 'Services & Prices', path: '/admin/services' },
    { label: 'Bookings', path: '/admin/bookings' },
    { label: 'Portfolio', path: '/admin/portfolio' },
    { label: 'Reviews', path: '/admin/reviews' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Team', path: '/admin/team' },
    { label: 'Availability', path: '/admin/availability' },
    { label: 'Settings', path: '/admin/settings' },
  ];

  const currentLabel = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="admin-layout">
      {/* Claude-style Fixed Header */}
      <AdminHeader 
        onMenuClick={() => setIsSidebarOpen(true)}
        currentLabel={currentLabel}
        currentUser={currentUser}
      />

      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <div className="breadcrumb">
            <span>Admin</span>
            <ChevronRight size={14} />
            <span className="current-page">{currentLabel}</span>
          </div>
          <div className="top-bar-actions">
            <a href="/" target="_blank" className="view-site-btn">View Live Site</a>
          </div>
        </header>

        <section className="admin-content-viewport">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/content" element={<ContentManager />} />
            <Route path="/services" element={<ServicesManager />} />
            <Route path="/bookings" element={<BookingsManager />} />
            <Route path="/portfolio" element={<PortfolioManager />} />
            <Route path="/reviews" element={<ReviewsManager />} />
            <Route path="/users" element={<UsersManager />} />
            <Route path="/team" element={<TeamManager />} />
            <Route path="/availability" element={<AvailabilityManager />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </section>
      </main>

      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}

// ── Live Overview Dashboard ──
function DashboardOverview() {
  const isMobile = useMobile();
  const [stats, setStats] = useState(null);
  const [bookingsStats, setBookingsStats] = useState({
    upcomingWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    topService: '—'
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
        if (docSnap.exists()) {
          const d = docSnap.data();
          const allReviews = d.reviews?.items || [];
          const approvedReviews = allReviews.filter(r => r.status === 'approved');
          const avgRating = approvedReviews.length > 0
            ? (approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length).toFixed(1)
            : '0.0';
          
          setStats({
            services: (d.services?.items?.length || 0) + (d.services?.otherItems?.length || 0),
            portfolio: d.gallery?.items?.length || 0,
            reviews: allReviews.length,
            team: d.team?.members?.length || 0,
            avgRating,
          });

          // Sort reviews by ID or implicit date (assuming higher ID is newer)
          setRecentReviews([...allReviews].reverse().slice(0, 3));
          setRecentPhotos((d.gallery?.items || []).slice(0, 4));
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };

    const fetchBookings = async () => {
      try {
        const q = query(collection(db, 'bookings'));
        const snapshot = await getDocs(q);
        const bookings = [];
        snapshot.forEach(d => bookings.push(d.data()));

        // Also fetch users and count bookings
        try {
          const usersQ = query(collection(db, 'users'));
          const usersSnap = await getDocs(usersQ);
          const usersList = [];
          usersSnap.forEach(d => {
            const data = d.data();
            // Count bookings for this user
            const userBookings = bookings.filter(b => b.clientId === d.id);
            usersList.push({
              id: d.id,
              ...data,
              bookingCount: userBookings.length,
              signupDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
            });
          });
          
          // Sort by most recent signup and take top 5
          usersList.sort((a, b) => b.signupDate - a.signupDate);
          setRecentUsers(usersList.slice(0, 5));
        } catch (err) {
          console.error("Users fetch error in dashboard:", err);
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Calculate week boundaries (Monday to Sunday)
        const dayOfWeek = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let upcomingWeekCount = 0;
        let thisMonthCount = 0;
        let lastMonthCount = 0;
        let pendingCount = 0;
        const serviceCounts = {};

        bookings.forEach(b => {
          if (!b.date) return;
          const bDate = new Date(b.date);
          bDate.setHours(0, 0, 0, 0);
          
          // Pending confirmations
          if (b.status === 'pending') {
            pendingCount++;
          }

          // Upcoming this week (not cancelled/completed)
          if (bDate >= today && bDate <= weekEnd && b.status !== 'cancelled' && b.status !== 'completed') {
            upcomingWeekCount++;
          }

          // Month trends
          if (bDate.getFullYear() === currentYear && bDate.getMonth() === currentMonth) {
            thisMonthCount++;
            if (b.services) {
              b.services.forEach(s => {
                serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
              });
            }
          } else if (bDate.getFullYear() === currentYear && bDate.getMonth() === currentMonth - 1) {
            lastMonthCount++;
          } else if (currentMonth === 0 && bDate.getFullYear() === currentYear - 1 && bDate.getMonth() === 11) {
            lastMonthCount++;
          }
        });

        let topService = '—';
        let maxCount = 0;
        for (const [sName, count] of Object.entries(serviceCounts)) {
          if (count > maxCount) {
            maxCount = count;
            topService = sName;
          }
        }

        setBookingsStats({
          upcomingWeek: upcomingWeekCount,
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount,
          pending: pendingCount,
          topService: topService
        });

      } catch (err) {
        console.error("Bookings fetch error:", err);
      }
    };

    fetchStats();
    fetchBookings();
  }, []);

  const trend = () => {
    if (bookingsStats.lastMonth === 0) return { val: bookingsStats.thisMonth > 0 ? 100 : 0, up: true };
    const diff = bookingsStats.thisMonth - bookingsStats.lastMonth;
    const perc = (diff / bookingsStats.lastMonth) * 100;
    return { val: Math.abs(Math.round(perc)), up: diff >= 0 };
  };
  const t = trend();

  return (
    <div className="overview-container">
      {/* 1. Hero Section */}
      <div className="overview-hero">
        <div className="welcome-msg">
          <h2>Welcome back, {currentUser?.displayName || 'Steve'}</h2>
          <p>Your studio is live and synced with the cloud infrastructure.</p>
        </div>
        <div className="site-status-pill">
          <div className="status-pulse" />
          <span className="status-text">Cloud Optimized</span>
        </div>
      </div>

      {/* 2. Insight Tiles / Mobile Summary Card */}
      {isMobile ? (
        <div className="mobile-summary-card">
          <div className="m-summary-header">
            <h3>Overview</h3>
          </div>
          
          <div className="m-summary-primary">
            <span className="m-primary-label">Upcoming this week</span>
            <div className="m-primary-value">{bookingsStats.upcomingWeek}</div>
          </div>
          
          <div className="m-summary-metrics">
            <div className="m-metric">
              <span className="m-metric-label">This Month</span>
              <div className="m-metric-value-wrap">
                <span className="m-metric-value">{bookingsStats.thisMonth}</span>
                <span className={`m-metric-trend ${t.up ? 'trend-up' : 'trend-down'}`}>
                  {t.up ? '↑' : '↓'} {t.val}%
                </span>
              </div>
            </div>
            
            <div className="m-metric">
              <span className="m-metric-label">Pending</span>
              <div className="m-metric-value-wrap">
                <span className="m-metric-value">{bookingsStats.pending}</span>
              </div>
            </div>
            
            <div className="m-metric full-width">
              <span className="m-metric-label">Top Service</span>
              <div className="m-metric-value-wrap">
                <span className="m-metric-value text-value">{bookingsStats.topService}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="insights-grid">
          <Link to="/admin/services" className="insight-card sage">
            <div className="insight-icon"><ListOrdered size={24} /></div>
            <div className="insight-info">
              <h4>Service Cards</h4>
              <div className="value">{stats?.services ?? '—'}</div>
            </div>
          </Link>
          <Link to="/admin/portfolio" className="insight-card mustard">
            <div className="insight-icon"><ImageIcon size={24} /></div>
            <div className="insight-info">
              <h4>Portfolio Photos</h4>
              <div className="value">{stats?.portfolio ?? '—'}</div>
            </div>
          </Link>
          <Link to="/admin/reviews" className="insight-card periwinkle">
            <div className="insight-icon"><MessageSquare size={24} /></div>
            <div className="insight-info">
              <h4>Total Reviews</h4>
              <div className="value">{stats?.reviews ?? '—'}</div>
            </div>
          </Link>
          <div className="insight-card burgundy">
            <div className="insight-icon"><Star size={24} /></div>
            <div className="insight-info">
              <h4>Average Rating</h4>
              <div className="value">{stats?.avgRating ?? '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Activity & Gallery Split */}
      <div className="overview-split">
        <div className="split-section">
          <h3><MessageSquare size={20} opacity={0.5} /> Recent Client Feedback</h3>
          <div className="activity-card">
            {recentReviews.length > 0 ? (
              recentReviews.map((rev, idx) => {
                if (!rev) return null;
                return (
                  <div key={rev.id || idx} className="activity-item">
                    <div className="item-avatar">{(rev.name || 'C').charAt(0)}</div>
                    <div className="item-content">
                      <p>{(rev.comment || '').substring(0, 80)}...</p>
                      <div className="time">by {rev.name || 'Guest'} • {rev.rating || 5} ⭐</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state-p">No recent reviews found.</p>
            )}
          </div>
        </div>

        <div className="split-section">
          <h3><ImageIcon size={20} opacity={0.5} /> Gallery Snapshot</h3>
          <div className="gallery-strip">
            {recentPhotos.map((p, idx) => {
              if (!p || !p.image) return null;
              return <img key={idx} src={p.image} alt="" className="strip-img" />;
            })}
            {recentPhotos.length === 0 && <p className="empty-state-p" style={{ gridColumn: 'span 2' }}>No photos.</p>}
          </div>
        </div>
      </div>

      {/* 4. Recent Users Preview */}
      <div className="recent-users-preview" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent Signups</h3>
          <Link to="/admin/users" style={{ color: 'var(--color-burgundy)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>See All</Link>
        </div>
        <div className="activity-card" style={{ padding: 0 }}>
          {recentUsers.length > 0 ? (
            <div className="preview-users-list">
              {recentUsers.map(user => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-burgundy)' }}>
                      {(user.displayName || user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-brown)', fontSize: '0.95rem' }}>{user.displayName || user.name || 'Unknown User'}</div>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-brown)', fontSize: '0.95rem' }}>{user.bookingCount}</div>
                    <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bookings</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>No recent users found.</div>
          )}
        </div>
      </div>

      {/* 5. Quick Actions Grid */}
      <div className="quick-actions-wrap">
        <h3 style={{ marginBottom: '24px', fontSize: '1.1rem', fontWeight: 800 }}>Command Shortcuts</h3>
        <div className="quick-grid">
          <Link to="/admin/services" className="quick-tile">
            <div className="tile-icon"><Plus size={18} /></div>
            <span className="tile-label">Add Service</span>
          </Link>
          <Link to="/admin/portfolio" className="quick-tile">
            <div className="tile-icon"><ImageIcon size={18} /></div>
            <span className="tile-label">Upload Photo</span>
          </Link>
          <Link to="/admin/bookings" className="quick-tile">
            <div className="tile-icon"><CalendarCheck size={18} /></div>
            <span className="tile-label">Check Bookings</span>
          </Link>
          <Link to="/admin/availability" className="quick-tile">
            <div className="tile-icon"><Clock size={18} /></div>
            <span className="tile-label">Set Hours</span>
          </Link>
          <Link to="/admin/settings" className="quick-tile">
            <div className="tile-icon"><Settings size={18} /></div>
            <span className="tile-label">Security Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
