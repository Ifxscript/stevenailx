import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../../lib/firebase';
import {
  collection, query, orderBy, doc, updateDoc, deleteDoc,
  setDoc, onSnapshot, addDoc, getDocs
} from 'firebase/firestore';
import { formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import {
  ArrowLeft, Search, Filter, Star, Trash2, CheckCircle2,
  XCircle, MessageCircle, Calendar, Clock, ChevronRight,
  AlertCircle, Loader2, User, Mail, Phone, CalendarCheck,
  ShieldCheck, Plus, X
} from 'lucide-react';

/* ── Design tokens (same as StudioAdminMobile) ─────────── */
const T = {
  bg:     '#f0ebe3',
  card:   '#fff',
  bdr:    '#e3dbd1',
  text:   '#1a1714',
  sub:    '#5c5852',
  mut:    '#8a857d',
  mutBg:  '#ede8e0',
  acc:    '#c94b35',
  accBg:  '#fdf3f1',
  dk:     '#18130e',
  grn:    '#1a9e5a',
  grnBg:  '#f0faf5',
};

const f = (style) => ({ fontFamily: 'Inter, system-ui, sans-serif', ...style });

/* ── Nav sections ──────────────────────────────────────── */
const NAVS = [
  { id: 'bookings', l: 'Bookings' },
  { id: 'users',    l: 'Users'    },
  { id: 'reviews',  l: 'Reviews'  },
];

/* ══════════════════════════════════════════════════════════
   SHARED ATOMS
   ══════════════════════════════════════════════════════════ */

function FP({ title, onBack, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: T.bg, borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', height: 52 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={20} color={T.text} />
        </button>
        <span style={f({ fontSize: 16, fontWeight: 700, color: T.text })}>{title}</span>
      </div>
      <div style={{ padding: '24px 16px 48px' }}>{children}</div>
    </div>
  );
}

function Confirm({ open, msg, onOk, onNo }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onNo} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div style={{ position: 'relative', background: T.card, borderRadius: 14, padding: 24, width: '100%', maxWidth: 320, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          <AlertCircle size={18} color={T.acc} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={f({ fontSize: 14, color: T.text, lineHeight: 1.5, margin: 0 })}>{msg}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNo}  style={f({ flex: 1, height: 44, borderRadius: 999, border: `1px solid ${T.bdr}`, background: 'transparent', fontSize: 14, fontWeight: 500, color: T.sub, cursor: 'pointer' })}>Cancel</button>
          <button onClick={onOk}  style={f({ flex: 1, height: 44, borderRadius: 999, border: 'none', background: T.acc, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' })}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Emp({ label }) {
  return (
    <div style={{ border: `1.5px dashed ${T.bdr}`, borderRadius: 14, padding: '36px 16px', textAlign: 'center' }}>
      <span style={f({ fontSize: 13, color: T.mut })}>{label}</span>
    </div>
  );
}

function TabPills({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12, marginBottom: 16, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={f({ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 999, border: `1px solid ${active === t.id ? T.acc : T.bdr}`, background: active === t.id ? T.accBg : T.card, fontSize: 12, fontWeight: active === t.id ? 700 : 500, color: active === t.id ? T.acc : T.sub, cursor: 'pointer' })}>
          {t.label}{t.count != null ? ` (${t.count})` : ''}
        </button>
      ))}
    </div>
  );
}

function Sect({ id, icon, title, action, children }) {
  return (
    <section id={id} style={{ marginBottom: 40, scrollMarginTop: 110 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <h2 style={f({ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 })}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.bdr, margin: '4px 0 32px' }} />;
}

function SectNav() {
  return (
    <div style={{ overflowX: 'auto', display: 'flex', gap: 7, padding: '10px 16px', background: T.bg, borderBottom: `1px solid ${T.bdr}`, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
      {NAVS.map(n => (
        <a key={n.id} href={`#${n.id}`} style={f({ display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 11px', borderRadius: 999, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 12, fontWeight: 500, color: T.sub, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 })}>
          {n.l}
        </a>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BOOKINGS SECTION
   ══════════════════════════════════════════════════════════ */

function statusStyle(status, date) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isMissed = date < todayStr && status !== 'cancelled' && status !== 'completed';
  if (status === 'completed') return { bg: '#e6e9f9', cl: '#4d547f', label: 'Completed' };
  if (status === 'cancelled') return { bg: '#fee2e2', cl: '#991b1b', label: 'Cancelled' };
  if (isMissed)               return { bg: '#fde68a', cl: '#92400e', label: 'Missed'    };
  if (status === 'confirmed') return { bg: T.grnBg,  cl: T.grn,     label: 'Confirmed' };
  return                             { bg: '#f9f0d9', cl: '#7a693f', label: 'Pending'   };
}

function BookingCard({ b, onUpdateStatus, onViewDetail }) {
  const ss = statusStyle(b.status, b.date);
  const initials = (b.clientName || 'C').charAt(0).toUpperCase();

  return (
    <div style={{ background: T.card, borderRadius: 14, boxShadow: `0 1px 4px rgba(0,0,0,.07)`, padding: '16px', marginBottom: 10 }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.mutBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={f({ fontSize: 15, fontWeight: 700, color: T.text })}>{initials}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={f({ fontSize: 14, fontWeight: 700, color: T.text })}>{b.clientName}</div>
          <div style={f({ fontSize: 12, color: T.mut, marginTop: 2 })}>{formatDisplayDate(b.date)} · {formatDisplayTime(b.timeSlot)}</div>
        </div>
        <span style={f({ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.cl })}>{ss.label}</span>
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {b.services?.map((s, i) => (
          <span key={i} style={f({ padding: '3px 9px', borderRadius: 7, background: T.mutBg, color: T.sub, fontSize: 12, fontWeight: 600 })}>{s.name}</span>
        ))}
      </div>

      {/* Price + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={f({ fontSize: 14, fontWeight: 700, color: T.text })}>₦{Number(b.totalPrice || 0).toLocaleString()}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {b.clientPhone && (
            <a
              href={`https://wa.me/${b.clientPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${b.clientName}! This is SteveNailX regarding your appointment on ${formatDisplayDate(b.date)}.`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ height: 32, padding: '0 12px', borderRadius: 999, background: '#25d366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <MessageCircle size={13} />WhatsApp
            </a>
          )}
          {b.status === 'confirmed' && (
            <>
              <button onClick={() => onUpdateStatus(b, 'completed')} style={f({ height: 32, padding: '0 12px', borderRadius: 999, background: T.grnBg, color: T.grn, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 })}>
                <CheckCircle2 size={13} />Done
              </button>
              {/* Hide Cancel once payment has been made — booking is locked */}
              {b.paymentStatus !== 'deposit_paid' && b.paymentStatus !== 'full_paid' && (
                <button onClick={() => onUpdateStatus(b, 'cancelled')} style={f({ height: 32, padding: '0 12px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 })}>
                  <XCircle size={13} />Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingsSect({ nav }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('requests');
  const [cfm, setCfm]           = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ ...d.data(), docId: d.id })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const doUpdateStatus = async (b, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', b.docId || b.id), { status: newStatus, updatedAt: new Date().toISOString() });
      // Email is handled server-side by the onBookingUpdated Cloud Function
    } catch {
      alert('Failed to update booking status. Please try again.');
    }
  };

  const requests  = bookings.filter(b => b.status === 'pending');
  const upcoming  = bookings.filter(b => b.status === 'confirmed' && b.date >= todayStr);
  const completed = bookings.filter(b => b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  const tabs = [
    { id: 'requests',  label: 'Requests',  count: requests.length  },
    { id: 'upcoming',  label: 'Upcoming',  count: upcoming.length  },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  const filtered = { requests, upcoming, completed, cancelled }[tab] || [];

  // Pending request card — Accept / Reject prominent
  const RequestCard = ({ b }) => (
    <div style={{ background: T.card, borderRadius: 14, boxShadow: `0 1px 4px rgba(0,0,0,.07)`, padding: '16px', marginBottom: 10, borderLeft: `3px solid #f59e0b` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={f({ fontSize: 15, fontWeight: 700, color: '#92400e' })}>{(b.clientName||'C').charAt(0).toUpperCase()}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={f({ fontSize: 14, fontWeight: 700, color: T.text })}>{b.clientName}</div>
          <div style={f({ fontSize: 12, color: T.mut, marginTop: 2 })}>{formatDisplayDate(b.date)} · {formatDisplayTime(b.timeSlot)}</div>
        </div>
        <span style={f({ padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' })}>Pending</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {b.services?.map((s, i) => (
          <span key={i} style={f({ padding: '3px 9px', borderRadius: 7, background: T.mutBg, color: T.sub, fontSize: 12, fontWeight: 600 })}>{s.name}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={f({ fontSize: 14, fontWeight: 700, color: T.text })}>₦{Number(b.totalPrice || 0).toLocaleString()}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* If payment has already been made, this booking is auto-confirmed — no Reject/Accept */}
          {(b.paymentStatus === 'deposit_paid' || b.paymentStatus === 'full_paid') ? (
            <span style={f({ height: 36, padding: '0 14px', borderRadius: 999, background: T.grnBg, color: T.grn, border: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 })}>
              <ShieldCheck size={14} />Payment Received
            </span>
          ) : (
            <>
              <button
                onClick={() => setCfm({ booking: b, status: 'cancelled', label: 'Reject' })}
                style={f({ height: 36, padding: '0 14px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' })}
              >
                Reject
              </button>
              <button
                onClick={() => setCfm({ booking: b, status: 'confirmed', label: 'Accept' })}
                style={f({ height: 36, padding: '0 14px', borderRadius: 999, background: T.grnBg, color: T.grn, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' })}
              >
                Accept
              </button>
            </>
          )}
        </div>
      </div>
      {b.notes ? <p style={f({ fontSize: 12, color: T.mut, marginTop: 10, fontStyle: 'italic' })}>"{b.notes}"</p> : null}
    </div>
  );

  const confirmMsg = () => {
    if (!cfm) return '';
    if (cfm.status === 'confirmed') return `Accept ${cfm.booking.clientName}'s request for ${formatDisplayDate(cfm.booking.date)}? They'll be notified by email.`;
    if (cfm.status === 'cancelled')  return `Reject ${cfm.booking.clientName}'s request? They'll be notified by email.`;
    if (cfm.status === 'completed')  return `Mark ${cfm.booking.clientName}'s appointment as completed?`;
    return `Update ${cfm.booking.clientName}'s booking?`;
  };

  return (
    <Sect id="bookings" icon={<Calendar size={16} color={T.acc} />} title="Bookings">
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} color={T.mut} className="animate-spin" /></div>
      ) : (
        <>
          <TabPills tabs={tabs} active={tab} onChange={setTab} />
          {tab === 'requests' && (
            filtered.length === 0
              ? <Emp label="No pending requests" />
              : filtered.map(b => <RequestCard key={b.docId || b.id} b={b} />)
          )}
          {tab !== 'requests' && (
            filtered.length === 0
              ? <Emp label={`No ${tab} bookings`} />
              : filtered.map(b => (
                <BookingCard
                  key={b.docId || b.id}
                  b={b}
                  onUpdateStatus={(booking, status) => setCfm({ booking, status })}
                />
              ))
          )}
        </>
      )}
      <Confirm
        open={!!cfm}
        msg={confirmMsg()}
        onOk={async () => { await doUpdateStatus(cfm.booking, cfm.status); setCfm(null); }}
        onNo={() => setCfm(null)}
      />
    </Sect>
  );
}

/* ══════════════════════════════════════════════════════════
   USERS SECTION
   ══════════════════════════════════════════════════════════ */

function UsersSect({ nav }) {
  const [rawUsers, setRawUsers]   = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'users')), snap => {
      setRawUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const u2 = onSnapshot(query(collection(db, 'bookings')), snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    if (filterOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const users = useMemo(() => {
    let list = rawUsers.map(u => {
      const ubs = bookings.filter(b => b.clientId === u.id);
      return { ...u, bookings: ubs, bookingCount: ubs.length, signupDate: u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || 0) };
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => (u.displayName || u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }
    list.sort((a, b) => sortBy === 'recent' ? b.signupDate - a.signupDate : b.bookingCount - a.bookingCount);
    return list;
  }, [rawUsers, bookings, search, sortBy]);

  const openProfile = (user) => {
    const Profile = () => (
      <FP title={user.displayName || user.name || 'User'} onBack={() => nav(null)}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.mutBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={f({ fontSize: 20, fontWeight: 700, color: T.text })}>{(user.displayName || user.name || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div style={f({ fontSize: 17, fontWeight: 700, color: T.text })}>{user.displayName || user.name || 'Unknown'}</div>
            <div style={f({ fontSize: 12, color: T.mut, marginTop: 2 })}>Joined {formatDisplayDate(user.signupDate.toISOString().split('T')[0])}</div>
          </div>
        </div>

        {/* Contact */}
        <div style={{ background: T.card, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 24, overflow: 'hidden' }}>
          {[
            { icon: <Mail size={14} color={T.mut} />, val: user.email, href: `mailto:${user.email}` },
            user.phone && { icon: <Phone size={14} color={T.mut} />, val: user.phone, href: `tel:${user.phone}` },
          ].filter(Boolean).map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${T.bdr}` : 'none' }}>
              {row.icon}
              <a href={row.href} style={f({ fontSize: 14, color: T.sub, textDecoration: 'none' })}>{row.val}</a>
            </div>
          ))}
        </div>

        {/* Booking history */}
        <p style={f({ fontSize: 11, fontWeight: 700, color: T.mut, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 })}>
          Booking History ({user.bookings.length})
        </p>
        {user.bookings.length === 0 ? <Emp label="No bookings yet" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user.bookings.map(b => {
              const ss = statusStyle(b.status, b.date);
              return (
                <div key={b.id} style={{ background: T.card, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', padding: '13px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={f({ fontSize: 13, fontWeight: 600, color: T.text })}>{formatDisplayDate(b.date)}</span>
                    <span style={f({ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ss.bg, color: ss.cl })}>{ss.label}</span>
                  </div>
                  <div style={f({ fontSize: 12, color: T.sub, marginBottom: 4 })}>{b.services?.map(s => s.name).join(', ') || 'Service'}</div>
                  <div style={f({ fontSize: 13, fontWeight: 700, color: T.text })}>₦{Number(b.totalPrice || 0).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </FP>
    );
    nav(<Profile />);
  };

  return (
    <Sect id="users" icon={<User size={16} color={T.acc} />} title="Users">
      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '0 12px', height: 44 }}>
          <Search size={15} color={T.mut} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={f({ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: T.text, background: 'transparent' })}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={14} color={T.mut} /></button>}
        </div>
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button onClick={() => setFilterOpen(p => !p)} style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Filter size={16} color={T.mut} />
          </button>
          {filterOpen && (
            <div style={{ position: 'absolute', right: 0, top: 48, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, minWidth: 160 }}>
              {[{ id: 'recent', l: 'Most Recent' }, { id: 'bookings', l: 'Most Bookings' }].map(opt => (
                <button key={opt.id} onClick={() => { setSortBy(opt.id); setFilterOpen(false); }} style={f({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', border: 'none', background: sortBy === opt.id ? T.accBg : 'transparent', fontSize: 13, fontWeight: sortBy === opt.id ? 700 : 500, color: sortBy === opt.id ? T.acc : T.sub, cursor: 'pointer' })}>
                  {opt.l}
                  {sortBy === opt.id && <CheckCircle2 size={13} color={T.acc} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} color={T.mut} className="animate-spin" /></div>
      ) : users.length === 0 ? (
        <Emp label="No users found" />
      ) : (
        <div style={{ background: T.card, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          {users.map((u, i) => (
            <button key={u.id} onClick={() => openProfile(u)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderBottom: i < users.length - 1 ? `1px solid ${T.bdr}` : 'none', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', borderRadius: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.mutBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={f({ fontSize: 14, fontWeight: 700, color: T.text })}>{(u.displayName || u.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={f({ fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{u.displayName || u.name || 'Unknown'}</div>
                <div style={f({ fontSize: 12, color: T.mut, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={f({ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: T.mutBg, color: T.sub })}>{u.bookingCount} bk</span>
                <ChevronRight size={16} color={T.mut} />
              </div>
            </button>
          ))}
        </div>
      )}
    </Sect>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEWS SECTION
   ══════════════════════════════════════════════════════════ */

function ReviewsSect({ nav }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('pending');
  const [cfm, setCfm]           = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(query(collection(db, 'reviews'), orderBy('date', 'desc')), snap => {
      setReviews(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const approve = async (review) => {
    try { await updateDoc(doc(db, 'reviews', review.id), { status: 'approved' }); }
    catch { alert('Failed to approve.'); }
  };

  const doDelete = async () => {
    try { await deleteDoc(doc(db, 'reviews', cfm.id)); setCfm(null); }
    catch { alert('Failed to delete.'); }
  };

  const openAddForm = () => {
    const Form = () => {
      const [form, setForm] = useState({ name: '', rating: 5, comment: '' });
      const [saving, setSaving] = useState(false);
      return (
        <FP title="Add Legacy Review" onBack={() => nav(null)}>
          <div style={{ background: T.card, borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
            <p style={f({ fontSize: 13, color: T.mut, margin: 0 })}>Manually record feedback from other platforms (Google, Instagram, etc.)</p>
          </div>
          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={f({ display: 'block', fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.08em' })}>Client Name</label>
            <input value={form.name} onChange={e => setForm(x => ({ ...x, name: e.target.value }))} placeholder="e.g. Victoria G." style={f({ width: '100%', fontSize: 15, color: T.text, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '12px 14px', outline: 'none', boxSizing: 'border-box', background: '#fff' })} />
          </div>
          {/* Rating */}
          <div style={{ marginBottom: 18 }}>
            <label style={f({ display: 'block', fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' })}>Rating</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(x => ({ ...x, rating: n }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <Star size={28} fill={n <= form.rating ? '#f59e0b' : 'none'} color={n <= form.rating ? '#f59e0b' : T.bdr} />
                </button>
              ))}
            </div>
          </div>
          {/* Comment */}
          <div style={{ marginBottom: 18 }}>
            <label style={f({ display: 'block', fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.08em' })}>Review</label>
            <textarea value={form.comment} onChange={e => setForm(x => ({ ...x, comment: e.target.value }))} rows={4} placeholder="Best nails I've ever had!" style={f({ width: '100%', fontSize: 15, color: T.text, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '12px 14px', outline: 'none', boxSizing: 'border-box', resize: 'none', lineHeight: 1.55, background: '#fff' })} />
          </div>
          <button
            disabled={saving || !form.name.trim() || !form.comment.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                const id = `manual_${Date.now()}`;
                await setDoc(doc(db, 'reviews', id), { ...form, id, date: new Date().toISOString(), status: 'approved', isLegacy: true, isVerified: false });
                nav(null);
              } catch { alert('Failed to save.'); }
              finally { setSaving(false); }
            }}
            style={f({ width: '100%', height: 52, borderRadius: 999, background: !form.name.trim() || !form.comment.trim() ? '#ccc' : T.dk, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 })}
          >
            {saving ? 'Saving…' : 'Save Review'}
          </button>
        </FP>
      );
    };
    nav(<Form />);
  };

  const pending  = reviews.filter(r => r.status !== 'approved');
  const approved = reviews.filter(r => r.status === 'approved');
  const avgRating = approved.length > 0
    ? (approved.reduce((s, r) => s + (r.rating || 0), 0) / approved.length).toFixed(1)
    : '—';

  const tabs = [
    { id: 'pending',  label: 'Pending',  count: pending.length  },
    { id: 'approved', label: 'Approved', count: approved.length },
    { id: 'all',      label: 'All',      count: reviews.length  },
  ];

  const filtered = { pending, approved, all: reviews }[tab] || [];

  const AddBtn = () => (
    <button onClick={openAddForm} style={f({ display: 'inline-flex', alignItems: 'center', gap: 5, height: 36, padding: '0 14px', borderRadius: 999, background: T.dk, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' })}>
      <Plus size={13} color="#fff" />Add Review
    </button>
  );

  return (
    <Sect id="reviews" icon={<Star size={16} color={T.acc} />} title="Reviews" action={<AddBtn />}>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Avg Rating', value: `⭐ ${avgRating}` },
          { label: 'Pending',    value: pending.length },
          { label: 'Approved',   value: approved.length },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, background: T.card, borderRadius: 12, padding: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', textAlign: 'center' }}>
            <div style={f({ fontSize: 16, fontWeight: 800, color: T.text })}>{stat.value}</div>
            <div style={f({ fontSize: 11, color: T.mut, marginTop: 2 })}>{stat.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} color={T.mut} className="animate-spin" /></div>
      ) : (
        <>
          <TabPills tabs={tabs} active={tab} onChange={setTab} />
          {filtered.length === 0 ? <Emp label="No reviews here" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(r => (
                <div key={r.id} style={{ background: T.card, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={f({ fontSize: 14, fontWeight: 700, color: T.text })}>{r.name}</span>
                        {r.status !== 'approved'
                          ? <span style={f({ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#fde68a', color: '#92400e' })}>PENDING</span>
                          : r.isLegacy
                            ? <span style={f({ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: T.mutBg, color: T.sub })}>LEGACY</span>
                            : <span style={f({ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: T.grnBg, color: T.grn, display: 'flex', alignItems: 'center', gap: 3 })}><ShieldCheck size={9} />VERIFIED</span>
                        }
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
                        {[1,2,3,4,5].map(n => <Star key={n} size={11} fill={n <= r.rating ? '#f59e0b' : 'none'} color={n <= r.rating ? '#f59e0b' : T.bdr} />)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {r.status !== 'approved' && (
                        <button onClick={() => approve(r)} style={f({ height: 30, padding: '0 10px', borderRadius: 999, background: T.grnBg, color: T.grn, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 })}>
                          <CheckCircle2 size={12} />Approve
                        </button>
                      )}
                      <button onClick={() => setCfm(r)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} color={T.acc} />
                      </button>
                    </div>
                  </div>
                  <p style={f({ fontSize: 14, color: T.sub, lineHeight: 1.55, margin: '0 0 8px' })}>"{r.comment}"</p>
                  {r.date && <div style={f({ fontSize: 11, color: T.mut })}>{new Date(r.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <Confirm open={!!cfm} msg={`Delete ${cfm?.name}'s review? This cannot be undone.`} onOk={doDelete} onNo={() => setCfm(null)} />
    </Sect>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function OperationsAdminMobile() {
  const [page, setPage]       = useState(null);
  const scrollPos             = useRef(0);

  const nav = useCallback(p => {
    if (p) scrollPos.current = window.scrollY;
    setPage(p);
  }, []);

  useEffect(() => {
    if (!page) window.scrollTo(0, scrollPos.current);
  }, [page]);

  if (page) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, overflowY: 'auto', background: T.bg }}>
        {page}
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SectNav />
      <div style={{ padding: '24px 16px 48px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.acc, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Operations</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 28px', letterSpacing: '-.3px', lineHeight: 1.2 }}>Keep your studio<br/>running smoothly.</h1>

        <BookingsSect nav={nav} />
        <Divider />
        <UsersSect nav={nav} />
        <Divider />
        <ReviewsSect nav={nav} />
      </div>
    </div>
  );
}
