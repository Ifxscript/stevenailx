import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, onSnapshot } from 'firebase/firestore';
import { useMobile } from '../../hooks/useMobile';
import { 
  BarChart3, Settings, Image as ImageIcon, ListOrdered, LogOut, 
  Home, ChevronRight, Menu, X, Star, Users, MessageSquare, CalendarCheck, Clock, Plus
} from 'lucide-react';
import StudioManagementPage from './StudioManagementPage';
import OperationsPage from './OperationsPage';
import PaymentsPage from './PaymentsPage';
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
    { label: 'Studio Management', path: '/admin/studio-management' },
    { label: 'Operations', path: '/admin/operations' },
    { label: 'Payments', path: '/admin/payments' },
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
            <Route path="/studio-management" element={<StudioManagementPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/content" element={<Navigate to="/admin/studio-management" replace />} />
            <Route path="/services" element={<Navigate to="/admin/studio-management" replace />} />
            <Route path="/portfolio" element={<Navigate to="/admin/studio-management" replace />} />
            <Route path="/team" element={<Navigate to="/admin/studio-management" replace />} />
            <Route path="/availability" element={<Navigate to="/admin/studio-management" replace />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/bookings" element={<Navigate to="/admin/operations" replace />} />
            <Route path="/users" element={<Navigate to="/admin/operations" replace />} />
            <Route path="/reviews" element={<Navigate to="/admin/operations" replace />} />
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
          
          setStats(prev => ({
            ...prev,
            services: (d.services?.items?.length || 0) + (d.services?.otherItems?.length || 0),
            portfolio: d.gallery?.items?.length || 0,
            reviews: allReviews.length,
            team: d.team?.members?.length || 0,
            avgRating,
          }));

          setRecentReviews([...allReviews].reverse().slice(0, 3));
          setRecentPhotos((d.gallery?.items || []).slice(0, 4));
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };

    fetchStats();

    let bookingsData = [];
    let usersData = [];

    const processCombinedData = () => {
      // Update Recent Users List
      const usersList = usersData.map(u => {
        const userBookings = bookingsData.filter(b => b.clientId === u.id);
        return {
          ...u,
          bookingCount: userBookings.length,
          signupDate: u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || Date.now())
        };
      });
      usersList.sort((a, b) => b.signupDate - a.signupDate);
      setRecentUsers(usersList.slice(0, 5));

      // Update Booking Stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const dayOfWeek = now.getDay() || 7;
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

      bookingsData.forEach(b => {
        if (!b.date) return;
        const bDate = new Date(b.date);
        bDate.setHours(0, 0, 0, 0);
        if (b.status === 'pending') pendingCount++;
        if (bDate >= today && bDate <= weekEnd && b.status !== 'cancelled' && b.status !== 'completed') {
          upcomingWeekCount++;
        }
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

      setStats(prev => ({ ...prev, totalUsers: usersData.length }));
    };

    const unsubBookings = onSnapshot(query(collection(db, 'bookings')), (snap) => {
      bookingsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      processCombinedData();
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      processCombinedData();
    });

    return () => {
      unsubBookings();
      unsubUsers();
    };
  }, []);

  const trend = () => {
    if (bookingsStats.lastMonth === 0) return { val: bookingsStats.thisMonth > 0 ? 100 : 0, up: true };
    const diff = bookingsStats.thisMonth - bookingsStats.lastMonth;
    const perc = (diff / bookingsStats.lastMonth) * 100;
    return { val: Math.abs(Math.round(perc)), up: diff >= 0 };
  };
  const t = trend();

  /* ── design tokens (matches StudioAdminMobile) ── */
  const T = { bg:'#f0ebe3', card:'#fff', bdr:'#e3dbd1', text:'#1a1714', sub:'#5c5852', mut:'#8a857d', mutBg:'#ede8e0', acc:'#c94b35', accBg:'#fdf3f1', dk:'#18130e', grn:'#1a9e5a', grnBg:'#f0faf5' };
  const F = { fontFamily:'Inter, system-ui, sans-serif' };

  const StatCard = ({ label, value, sub, accent }) => (
    <div style={{ background: T.card, borderRadius: 14, boxShadow:'0 1px 4px rgba(0,0,0,.07)', padding:'16px', flex:1 }}>
      <div style={{ ...F, fontSize:22, fontWeight:800, color: accent ? T.acc : T.text, marginBottom:4 }}>{value ?? '—'}</div>
      <div style={{ ...F, fontSize:12, fontWeight:700, color:T.mut }}>{label}</div>
      {sub && <div style={{ ...F, fontSize:11, color: t.up ? T.grn : T.acc, marginTop:4, fontWeight:600 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:'Inter, system-ui, sans-serif', padding:'24px 16px 48px' }}>

      {/* ── Header ── */}
      <p style={{ ...F, fontSize:10, fontWeight:700, color:T.acc, letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 6px' }}>Overview</p>
      <h1 style={{ ...F, fontSize:22, fontWeight:800, color:T.text, margin:'0 0 4px', letterSpacing:'-.3px', lineHeight:1.2 }}>
        Welcome back, {currentUser?.displayName || 'Steve'}
      </h1>
      <p style={{ ...F, fontSize:13, color:T.sub, margin:'0 0 28px' }}>Your studio is live.</p>

      {/* ── Pending requests alert ── */}
      {bookingsStats.pending > 0 && (
        <Link to="/admin/operations" style={{ textDecoration:'none', display:'block', marginBottom:16 }}>
          <div style={{ background:T.accBg, border:`1px solid rgba(201,75,53,.25)`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <CalendarCheck size={18} color={T.acc} />
              <span style={{ ...F, fontSize:14, fontWeight:700, color:T.acc }}>{bookingsStats.pending} booking request{bookingsStats.pending !== 1 ? 's' : ''} waiting</span>
            </div>
            <span style={{ ...F, fontSize:12, fontWeight:700, color:T.acc }}>Review →</span>
          </div>
        </Link>
      )}

      {/* ── Stats row ── */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        <StatCard label="This week" value={bookingsStats.upcomingWeek} />
        <StatCard label="This month" value={bookingsStats.thisMonth} sub={`${t.up ? '↑' : '↓'} ${t.val}% vs last`} />
        <StatCard label="Pending" value={bookingsStats.pending} accent={bookingsStats.pending > 0} />
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:28 }}>
        <StatCard label="Total Users" value={stats?.totalUsers} />
        <StatCard label="Portfolio" value={stats?.portfolio} />
        <StatCard label="Avg Rating" value={stats?.avgRating ? `⭐ ${stats.avgRating}` : '—'} />
      </div>

      {/* ── Recent Reviews ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ ...F, fontSize:13, fontWeight:700, color:T.text }}>Recent Reviews</span>
          <Link to="/admin/operations" style={{ ...F, fontSize:12, fontWeight:600, color:T.acc, textDecoration:'none' }}>See all →</Link>
        </div>
        {recentReviews.length === 0 ? (
          <div style={{ border:`1.5px dashed ${T.bdr}`, borderRadius:14, padding:'28px 16px', textAlign:'center' }}>
            <span style={{ ...F, fontSize:13, color:T.mut }}>No reviews yet</span>
          </div>
        ) : (
          <div style={{ background:T.card, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.07)', overflow:'hidden' }}>
            {recentReviews.filter(Boolean).map((rev, idx) => (
              <div key={rev.id || idx} style={{ display:'flex', gap:12, padding:'13px 16px', borderBottom: idx < recentReviews.length-1 ? `1px solid ${T.bdr}` : 'none' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:T.mutBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ ...F, fontSize:14, fontWeight:700, color:T.text }}>{(rev.name||'C').charAt(0)}</span>
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ ...F, fontSize:13, fontWeight:700, color:T.text }}>{rev.name || 'Guest'}</span>
                    <span style={{ ...F, fontSize:11, color:'#f59e0b' }}>{'⭐'.repeat(rev.rating || 5)}</span>
                  </div>
                  <p style={{ ...F, fontSize:12, color:T.sub, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{rev.comment || ''}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Gallery ── */}
      {recentPhotos.filter(p => p?.image).length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ ...F, fontSize:13, fontWeight:700, color:T.text }}>Gallery Snapshot</span>
            <Link to="/admin/studio-management" style={{ ...F, fontSize:12, fontWeight:600, color:T.acc, textDecoration:'none' }}>Manage →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {recentPhotos.filter(p => p?.image).map((p, idx) => (
              <div key={idx} style={{ aspectRatio:'1', borderRadius:10, overflow:'hidden', background:T.mutBg }}>
                <img src={p.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Signups ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ ...F, fontSize:13, fontWeight:700, color:T.text }}>Recent Signups</span>
          <Link to="/admin/operations" style={{ ...F, fontSize:12, fontWeight:600, color:T.acc, textDecoration:'none' }}>See all →</Link>
        </div>
        {recentUsers.length === 0 ? (
          <div style={{ border:`1.5px dashed ${T.bdr}`, borderRadius:14, padding:'28px 16px', textAlign:'center' }}>
            <span style={{ ...F, fontSize:13, color:T.mut }}>No signups yet</span>
          </div>
        ) : (
          <div style={{ background:T.card, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.07)', overflow:'hidden' }}>
            {recentUsers.map((user, idx) => (
              <div key={user.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderBottom: idx < recentUsers.length-1 ? `1px solid ${T.bdr}` : 'none' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:T.mutBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ ...F, fontSize:13, fontWeight:700, color:T.text }}>{(user.displayName||user.name||'U').charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ ...F, fontSize:13, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.displayName||user.name||'Unknown'}</div>
                  <div style={{ ...F, fontSize:11, color:T.mut, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                </div>
                <span style={{ ...F, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:T.mutBg, color:T.sub, flexShrink:0 }}>{user.bookingCount} bk</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <p style={{ ...F, fontSize:11, fontWeight:700, color:T.mut, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Quick Links</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { label:'Booking Requests', to:'/admin/operations', icon:<CalendarCheck size={15}/>, accent:bookingsStats.pending > 0 },
          { label:'Add to Portfolio', to:'/admin/studio-management', icon:<ImageIcon size={15}/> },
          { label:'Manage Reviews', to:'/admin/operations', icon:<MessageSquare size={15}/> },
          { label:'Settings', to:'/admin/settings', icon:<Settings size={15}/> },
        ].map(link => (
          <Link key={link.label} to={link.to} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'14px', background: link.accent ? T.accBg : T.card, borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,.07)', border: link.accent ? `1px solid rgba(201,75,53,.2)` : 'none' }}>
            <span style={{ color: link.accent ? T.acc : T.mut }}>{link.icon}</span>
            <span style={{ ...F, fontSize:13, fontWeight:600, color: link.accent ? T.acc : T.text }}>{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
