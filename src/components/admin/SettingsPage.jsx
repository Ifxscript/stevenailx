import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Loader2, CheckCircle2, Mail, Lock, Database } from 'lucide-react';

const T = { bg:'#f0ebe3', card:'#fff', bdr:'#e3dbd1', text:'#1a1714', sub:'#5c5852', mut:'#8a857d', mutBg:'#ede8e0', acc:'#c94b35', dk:'#18130e', grn:'#1a9e5a', grnBg:'#f0faf5' };
const F = (s) => ({ fontFamily:'Inter, system-ui, sans-serif', ...s });

function SettingsPage() {
  const { currentUser } = useAuth();
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [marketerEmails, setMarketerEmails] = useState([]);
  const [newMarketerEmail, setNewMarketerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState(null);
  const [confirmDeleteMarketerEmail, setConfirmDeleteMarketerEmail] = useState(null);

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'site_content', 'landing_page');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const security = docSnap.data().security || {};
        const roster = security.adminEmails || ['ianekwe7@gmail.com'];
        const mRoster = security.marketerEmails || [];
        setAdminEmails(roster.filter(email => email && email.trim() !== ''));
        setMarketerEmails(mRoster.filter(email => email && email.trim() !== ''));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'site_content', 'landing_page');
      
      // 1. Update the security roster doc
      await updateDoc(docRef, {
        'security.adminEmails': adminEmails.filter(e => e && e.trim() !== ''),
        'security.marketerEmails': marketerEmails.filter(e => e && e.trim() !== '')
      });

      // 2. Sync roles to individual user documents for all marketers
      // (This ensures UsersManager and other components see the role immediately)
      const usersRef = collection(db, 'users');
      const allUsersSnap = await getDocs(usersRef);
      
      const batchPromises = allUsersSnap.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const email = userData.email?.toLowerCase();
        if (!email) return;

        const isMarketer = marketerEmails.includes(email);
        const currentRole = userData.role;

        if (isMarketer && currentRole !== 'marketer') {
          await updateDoc(userDoc.ref, { role: 'marketer' });
        } else if (!isMarketer && currentRole === 'marketer') {
          await updateDoc(userDoc.ref, { role: null });
        }
      });

      await Promise.all(batchPromises);
      
      alert("✅ Security updated and roles synchronized.");
    } catch (err) {
      console.error(err);
      alert("Failed to save security settings.");
    } finally {
      setSaving(false);
    }
  };

  const addAdminEmail = () => {
    const trimmed = newAdminEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    if (adminEmails.includes(trimmed)) return;
    setAdminEmails(prev => [...prev, trimmed]);
    setNewAdminEmail('');
  };

  const removeAdminEmail = (email) => {
    const targetEmail = email.trim().toLowerCase();
    const currentEmail = currentUser?.email?.trim().toLowerCase();
    
    if (targetEmail === currentEmail) return;
    
    setAdminEmails(prev => prev.filter(e => e.trim().toLowerCase() !== targetEmail));
    setConfirmDeleteEmail(null);
  };

  const addMarketerEmail = () => {
    const trimmed = newMarketerEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    if (marketerEmails.includes(trimmed)) return;
    setMarketerEmails(prev => [...prev, trimmed]);
    setNewMarketerEmail('');
  };

  const removeMarketerEmail = (email) => {
    const targetEmail = email.trim().toLowerCase();
    setMarketerEmails(prev => prev.filter(e => e.trim().toLowerCase() !== targetEmail));
    setConfirmDeleteMarketerEmail(null);
  };

  const EmailRow = ({ email, isYou, onDelete, cfmEmail, setCfm }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 0', borderBottom:`1px solid ${T.bdr}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <CheckCircle2 size={14} color={T.grn} style={{ opacity:.5 }} />
        <span style={F({ fontSize:14, fontWeight:600, color:T.text })}>{email}</span>
        {isYou && <span style={F({ fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:999, background:T.grnBg, color:T.grn })}>YOU</span>}
      </div>
      {!isYou && (
        cfmEmail === email ? (
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => onDelete(email)} style={F({ height:28, padding:'0 10px', borderRadius:999, background:'#fee2e2', color:'#991b1b', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' })}>Remove</button>
            <button onClick={() => setCfm(null)} style={F({ height:28, padding:'0 10px', borderRadius:999, background:T.mutBg, color:T.sub, border:'none', fontSize:12, fontWeight:500, cursor:'pointer' })}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setCfm(email)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:8, display:'flex', alignItems:'center' }}>
            <Trash2 size={15} color={T.acc} />
          </button>
        )
      )}
    </div>
  );

  const InviteRow = ({ value, onChange, onAdd, placeholder }) => (
    <div style={{ display:'flex', gap:8, marginTop:8 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder={placeholder}
        style={F({ flex:1, height:44, padding:'0 14px', border:`1px solid ${T.bdr}`, borderRadius:10, fontSize:14, color:T.text, outline:'none', background:'#fff' })}
      />
      <button onClick={onAdd} style={{ width:44, height:44, borderRadius:10, background:T.dk, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Plus size={16} color="#fff" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ background:T.bg, minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Loader2 className="animate-spin" size={28} color={T.mut} />
      </div>
    );
  }

  return (
    <div style={{ background:T.bg, fontFamily:'Inter, system-ui, sans-serif', padding:'24px 16px 48px' }}>
      <p style={F({ fontSize:10, fontWeight:700, color:T.acc, letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 6px' })}>Settings</p>
      <h1 style={F({ fontSize:22, fontWeight:800, color:T.text, margin:'0 0 28px', letterSpacing:'-.3px', lineHeight:1.2 })}>Access & Security</h1>

      {/* ── Active admin info ── */}
      <div style={{ background:T.card, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.07)', padding:'16px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:T.mutBg, borderRadius:10, marginBottom:12 }}>
          <Mail size={14} color={T.mut} />
          <span style={F({ fontSize:14, fontWeight:600, color:T.text })}>{currentUser?.email}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:T.mutBg, borderRadius:10 }}>
          <Lock size={14} color={T.mut} />
          <span style={F({ fontSize:14, fontWeight:600, color:T.text })}>Super Admin Access</span>
        </div>
      </div>

      {/* ── Admin roster ── */}
      <div style={{ background:T.card, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.07)', padding:'16px', marginBottom:16 }}>
        <p style={F({ fontSize:11, fontWeight:700, color:T.mut, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' })}>Admin Roster</p>
        <p style={F({ fontSize:12, color:T.sub, margin:'0 0 12px' })}>Emails with full dashboard access.</p>
        {adminEmails.map(email => (
          <EmailRow
            key={email} email={email}
            isYou={email === currentUser?.email?.trim().toLowerCase()}
            onDelete={removeAdminEmail}
            cfmEmail={confirmDeleteEmail}
            setCfm={setConfirmDeleteEmail}
          />
        ))}
        <InviteRow value={newAdminEmail} onChange={setNewAdminEmail} onAdd={addAdminEmail} placeholder="Invite admin email…" />
      </div>

      {/* ── Marketer roster ── */}
      <div style={{ background:T.card, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.07)', padding:'16px', marginBottom:24 }}>
        <p style={F({ fontSize:11, fontWeight:700, color:T.mut, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 4px' })}>Marketer Roster</p>
        <p style={F({ fontSize:12, color:T.sub, margin:'0 0 12px' })}>Limited access — blog editor only.</p>
        {marketerEmails.length === 0 && (
          <p style={F({ fontSize:13, color:T.mut, padding:'8px 0' })}>No marketers added yet.</p>
        )}
        {marketerEmails.map(email => (
          <EmailRow
            key={email} email={email}
            isYou={false}
            onDelete={removeMarketerEmail}
            cfmEmail={confirmDeleteMarketerEmail}
            setCfm={setConfirmDeleteMarketerEmail}
          />
        ))}
        <InviteRow value={newMarketerEmail} onChange={setNewMarketerEmail} onAdd={addMarketerEmail} placeholder="Invite marketer email…" />
      </div>

      {/* ── Cloud sync note ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginBottom:24, opacity:.6 }}>
        <Database size={13} color={T.grn} />
        <span style={F({ fontSize:11, fontWeight:700, color:T.grn, letterSpacing:'.06em', textTransform:'uppercase' })}>Cloud Engine Synchronized</span>
      </div>

      {/* ── Save / Discard ── */}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={fetchSecuritySettings} style={F({ flex:1, height:48, borderRadius:999, border:`1px solid ${T.bdr}`, background:'transparent', fontSize:14, fontWeight:500, color:T.sub, cursor:'pointer' })}>Discard</button>
        <button onClick={handleSaveSecurity} disabled={saving} style={F({ flex:2, height:48, borderRadius:999, border:'none', background:T.dk, fontSize:14, fontWeight:700, color:'#fff', cursor:saving?'default':'pointer' })}>{saving?'Saving…':'Save Changes'}</button>
      </div>
    </div>
  );
}

export default SettingsPage;
