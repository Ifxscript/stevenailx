import { useState, useEffect, useMemo } from 'react';
import { Search, ReceiptText, TrendingUp, Calendar, ChevronDown } from 'lucide-react';

const T = {
  bg: '#f0ebe3', card: '#fff', bdr: '#e3dbd1', text: '#1a1714', sub: '#5c5852',
  mut: '#8a857d', mutBg: '#ede8e0', acc: '#c94b35', accBg: '#fdf3f1',
  dk: '#18130e', grn: '#1a9e5a', grnBg: '#f0faf5',
};
const F = { fontFamily: 'Inter, system-ui, sans-serif' };
const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const fmtDate = (str) => {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return str; }
};

function SummaryCard({ label, value, sub, icon, accent }) {
  return (
    <div style={{ background: T.card, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.07)', padding: '16px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ color: accent ? T.acc : T.mut }}>{icon}</span>
        <span style={{ ...F, fontSize: 11, fontWeight: 700, color: T.mut, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      </div>
      <div style={{ ...F, fontSize: 22, fontWeight: 800, color: accent ? T.acc : T.text }}>{value}</div>
      {sub && <div style={{ ...F, fontSize: 11, color: T.mut, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    confirmed: { bg: '#E1E8DE', color: '#4F5E49' },
    completed: { bg: '#E6E9F9', color: '#4D547F' },
  };
  const c = colors[status] || { bg: T.mutBg, color: T.mut };
  return (
    <span style={{ ...F, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetch('/api/payment-history', {
      headers: { 'x-internal-secret': import.meta.env.VITE_SEND_EMAIL_SECRET || '' },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPayments(data.payments || []);
        setSource(data.source || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const totalRevenue = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
  const thisMonthPayments = payments.filter(p => {
    const d = new Date(p.paidAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const thisMonthRevenue = thisMonthPayments.reduce((s, p) => s + (p.amountPaid || 0), 0);

  const filtered = useMemo(() => {
    return payments
      .filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const hit = p.orderId?.toLowerCase().includes(q)
            || p.clientName?.toLowerCase().includes(q)
            || p.paystackReference?.toLowerCase().includes(q)
            || p.clientEmail?.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (fromDate && p.paidAt && p.paidAt.slice(0, 10) < fromDate) return false;
        if (toDate && p.paidAt && p.paidAt.slice(0, 10) > toDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  }, [payments, search, statusFilter, fromDate, toDate]);

  const filteredTotal = filtered.reduce((s, p) => s + (p.amountPaid || 0), 0);

  if (loading) {
    return (
      <div style={{ ...F, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: T.mut, fontSize: 14 }}>Loading payments...</span>
      </div>
    );
  }

  return (
    <div style={{ ...F, background: T.bg, minHeight: '100vh', padding: '24px 16px 48px' }}>

      {/* Header */}
      <p style={{ fontSize: 10, fontWeight: 700, color: T.acc, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Payments</p>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-.3px' }}>Payment History</h1>
      <p style={{ fontSize: 13, color: T.sub, margin: '0 0 24px' }}>
        All confirmed and completed deposits
        {source === 'paystack' && <span style={{ marginLeft: 6, fontSize: 11, color: T.mut }}>(via Paystack)</span>}
        {source === 'firestore' && <span style={{ marginLeft: 6, fontSize: 11, color: T.mut }}>(via Firestore)</span>}
      </p>

      {error && (
        <div style={{ background: T.accBg, border: `1px solid rgba(201,75,53,.25)`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: T.acc }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <SummaryCard
          label="Total Collected"
          value={naira(totalRevenue)}
          sub={`${payments.length} transaction${payments.length !== 1 ? 's' : ''}`}
          icon={<ReceiptText size={15} />}
        />
        <SummaryCard
          label="This Month"
          value={naira(thisMonthRevenue)}
          sub={`${thisMonthPayments.length} payment${thisMonthPayments.length !== 1 ? 's' : ''}`}
          icon={<TrendingUp size={15} />}
          accent
        />
      </div>

      {/* Filters */}
      <div style={{ background: T.card, borderRadius: 14, padding: '16px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.mut }} />
          <input
            type="text"
            placeholder="Search by Order ID, name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 13, background: T.bg, color: T.text, outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {/* Date range + Status row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 140 }}>
            <Calendar size={14} color={T.mut} />
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 12, background: T.bg, color: T.text, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <span style={{ fontSize: 12, color: T.mut }}>to</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{ flex: 1, minWidth: 140, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 12, background: T.bg, color: T.text, outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ position: 'relative' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ appearance: 'none', padding: '8px 32px 8px 12px', borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 12, background: T.bg, color: T.text, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: T.mut, pointerEvents: 'none' }} />
          </div>
          {(search || statusFilter !== 'all' || fromDate || toDate) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setFromDate(''); setToDate(''); }}
              style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 12, background: 'transparent', color: T.acc, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count + filtered total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: T.mut, fontWeight: 600 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        {filtered.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: T.grn }}>
            Total: {naira(filteredTotal)}
          </span>
        )}
      </div>

      {/* Payment Cards */}
      {filtered.length === 0 ? (
        <div style={{ border: `1.5px dashed ${T.bdr}`, borderRadius: 14, padding: '40px 16px', textAlign: 'center' }}>
          <ReceiptText size={28} color={T.mut} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: T.mut, margin: 0 }}>No payments found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ background: T.card, borderRadius: 14, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{p.clientName || '—'}</div>
                  <div style={{ fontSize: 11, color: T.mut, marginTop: 2 }}>{p.clientEmail}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: T.sub }}>
                <span><span style={{ color: T.mut, fontWeight: 600 }}>Order ID: </span>{p.orderId || '—'}</span>
                <span><span style={{ color: T.mut, fontWeight: 600 }}>Date paid: </span>{fmtDate(p.paidAt)}</span>
                {p.appointmentDate && (
                  <span><span style={{ color: T.mut, fontWeight: 600 }}>Appt: </span>{p.appointmentDate}</span>
                )}
                {p.services && (
                  <span><span style={{ color: T.mut, fontWeight: 600 }}>Services: </span>{p.services}</span>
                )}
                {p.paystackReference && p.paystackReference !== p.orderId && (
                  <span><span style={{ color: T.mut, fontWeight: 600 }}>Ref: </span>{p.paystackReference}</span>
                )}
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: T.grn }}>{naira(p.amountPaid)}</span>
                  {p.depositOption && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: T.mut }}>
                      {p.depositOption === 'full' ? 'full payment' : '30% deposit'}
                    </span>
                  )}
                </div>
                {p.totalPrice > p.amountPaid && (
                  <span style={{ fontSize: 11, color: T.acc, fontWeight: 600 }}>
                    {naira(p.totalPrice - p.amountPaid)} balance due
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
