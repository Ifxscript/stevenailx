import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus,
  Save,
  CloudUpload, 
  ShieldCheck, 
  Trash2, 
  RefreshCcw, 
  Loader2, 
  CheckCircle2,
  Mail,
  Lock,
  Database,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import HubActionPill from './HubActionPill';
import { useMobile } from '../../hooks/useMobile';
import '../../styles/AdminHub.css';

function SettingsPage() {
  const isMobile = useMobile();
  const { currentUser } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState(null);

  useEffect(() => {
    setActiveSectionId('security');
  }, []);

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
        setAdminEmails(roster.filter(email => email && email.trim() !== ''));
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
      await updateDoc(docRef, {
        'security.adminEmails': adminEmails.filter(e => e && e.trim() !== '')
      });
      alert("✅ Security updated.");
    } catch {
      alert("Failed to save.");
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

  const securityComponent = (
    <div className="hub-form-grid">
      <div className="hub-field-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
          <div className="input-field">
            <label className="field-label"><span>Active Admin Email</span><small>Authorized Identity</small></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f9f7f2', borderRadius: '12px', color: '#4a1a26', fontWeight: 700 }}>
              <Mail size={16} opacity={0.4} />
              {currentUser?.email}
            </div>
          </div>
          <div className="input-field">
            <label className="field-label"><span>Current Access Level</span><small>Permission Tier</small></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f9f7f2', borderRadius: '12px', color: '#4a1a26', fontWeight: 700 }}>
              <Lock size={16} opacity={0.4} />
              Super Admin Access
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '48px 0' }} />

        <label className="field-label" style={{ marginBottom: '24px' }}>
          <span>Authorised Admin Roster</span>
          <small>Emails listed here have full dashboard access.</small>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
          {adminEmails.map(email => (
            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={16} color="#4F5E49" opacity={0.4} />
                <span style={{ fontWeight: 600, color: '#4a1a26' }}>{email}</span>
                {email === currentUser?.email && <span style={{ fontSize: '0.6rem', background: 'rgba(79, 94, 73, 0.08)', color: '#4F5E49', padding: '2px 8px', borderRadius: '100px', fontWeight: 800 }}>YOU</span>}
              </div>
              {email.trim().toLowerCase() !== currentUser?.email?.trim().toLowerCase() && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {confirmDeleteEmail === email ? (
                    <>
                      <button 
                        type="button"
                        onClick={() => removeAdminEmail(email)} 
                        style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Confirm
                      </button>
                      <button 
                        type="button"
                        onClick={() => setConfirmDeleteEmail(null)} 
                        style={{ background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setConfirmDeleteEmail(email)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#8E8484', 
                        cursor: 'pointer',
                        padding: '8px',
                        margin: '-8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Remove admin"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            className="hub-input" 
            placeholder="New admin email..." 
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAdminEmail()}
          />
          <button className="action-btn save" onClick={addAdminEmail}>
            <Plus size={18} />
            <span>Invite</span>
          </button>
        </div>
      </div>
    </div>
  );

  const cloudComponent = (
    <div className="hub-form-grid">
      <div className="hub-field-card" style={{ backgroundColor: 'var(--hub-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
           <Database size={24} color="#4F5E49" />
           <div>
             <h3 style={{ fontWeight: 800, color: '#4F5E49' }}>Cloud is Synchronized</h3>
             <p style={{ color: '#8E8484', fontSize: '0.85rem' }}>Real-time heartbeat is active.</p>
           </div>
        </div>
      </div>
    </div>
  );

  const unifiedMobileComponent = (
    <div className="hub-form-grid">
      {/* Account & Security Header */}
      <div className="hub-field-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          <div className="input-field">
            <label className="field-label"><span>Active Admin Email</span><small>Authorized Identity</small></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#f9f7f2', borderRadius: '12px', color: '#4a1a26', fontWeight: 700, fontSize: '0.9rem' }}>
              <Mail size={14} opacity={0.4} />
              {currentUser?.email}
            </div>
          </div>
          <div className="input-field">
            <label className="field-label"><span>Access Level</span><small>Permission Tier</small></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#f9f7f2', borderRadius: '12px', color: '#4a1a26', fontWeight: 700, fontSize: '0.9rem' }}>
              <Lock size={14} opacity={0.4} />
              Super Admin Access
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '32px 0' }} />

        <label className="field-label" style={{ marginBottom: '16px' }}>
          <span>Authorised Admin Roster</span>
          <small>Emails listed here have full dashboard access.</small>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
          {adminEmails.map(email => (
            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={14} color="#4F5E49" opacity={0.4} />
                <span style={{ fontWeight: 600, color: '#4a1a26', fontSize: '0.9rem' }}>{email}</span>
                {email === currentUser?.email && <span style={{ fontSize: '0.55rem', background: 'rgba(79, 94, 73, 0.08)', color: '#4F5E49', padding: '2px 6px', borderRadius: '100px', fontWeight: 800 }}>YOU</span>}
              </div>
              {email.trim().toLowerCase() !== currentUser?.email?.trim().toLowerCase() && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {confirmDeleteEmail === email ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => removeAdminEmail(email)} 
                        style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        Remove
                      </button>
                      <button 
                        type="button"
                        onClick={() => setConfirmDeleteEmail(null)} 
                        style={{ background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setConfirmDeleteEmail(email)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#8E8484', 
                        cursor: 'pointer',
                        padding: '10px',
                        margin: '-10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            className="hub-input" 
            placeholder="Invite admin..." 
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAdminEmail()}
            style={{ fontSize: '0.9rem' }}
          />
          <button className="action-btn save" onClick={addAdminEmail} style={{ padding: '0 16px' }}>
            <Plus size={16} />
          </button>
        </div>

        {/* Subtle Cloud Sync Indicator */}
        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.6, justifyContent: 'center' }}>
          <Database size={14} color="#4F5E49" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F5E49', letterSpacing: '0.02em' }}>CLOUD ENGINE IS SYNCHRONIZED</span>
        </div>
      </div>
    </div>
  );

  const sections = [
    { 
      id: 'security', 
      label: 'Account & Security', 
      description: 'Manage administrative access and identity settings.',
      icon: <ShieldCheck size={20} />,
      status: 'Active',
      component: securityComponent
    },
    { 
      id: 'cloud', 
      label: 'Cloud Engine', 
      description: 'Monitor your studio\'s connection state.',
      icon: <CloudUpload size={20} />,
      status: 'Live',
      component: cloudComponent
    }
  ];

  if (loading) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Security Vault...</p>
      </div>
    );
  }

  return (
    <div className="manager-container">
      {isMobile ? (
        <div style={{ padding: '0', paddingBottom: '100px' }}>
          {unifiedMobileComponent}
          <HubActionPill
            onSave={handleSaveSecurity}
            onDiscard={fetchSecuritySettings}
            isSaving={saving}
            hasChanges={true}
            saveLabel="Save Changes"
          />
        </div>
      ) : (
        <AdminMobileLayout 
          title="Settings"
          description="Configure your administrative profile, security rosters, and cloud engine settings."
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionChange={setActiveSectionId}
          onSave={handleSaveSecurity}
          onDiscard={fetchSecuritySettings}
          isSaving={saving}
          hasChanges={true}
        />
      )}
    </div>
  );
}

export default SettingsPage;
