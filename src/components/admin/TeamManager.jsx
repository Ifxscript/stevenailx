import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { 
  Loader2, Plus, Trash2, Save, UploadCloud, 
  Users, UserCheck, ShieldCheck, Edit3, X 
} from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import AdminUploadLayout from './AdminUploadLayout';
import AdminMediaTile from './AdminMediaTile';
import AdminAddButton from './AdminAddButton';
import AdminSectionDescription from './AdminSectionDescription';
import HubActionPill from './HubActionPill';
import { useMobile } from '../../hooks/useMobile';

// ── Sub-Component for the Team Grid ──
function TeamGrid({ 
  list, 
  members, 
  activeSectionId, 
  isMobile,
  onAdd, 
  onEdit, 
  onDelete, 
  ...props 
}) {
  return (
    <div className="hub-form-grid">
      {isMobile ? (
        <>
          <div style={{ marginBottom: '12px' }}>
            <AdminSectionDescription text="Manage your studio's professional team and roles." />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <AdminAddButton label="Add Member" onClick={() => onAdd(props)} />
          </div>
        </>
      ) : (
        <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ textTransform: 'capitalize', fontSize: '1.25rem', fontWeight: 800 }}>
              {activeSectionId === 'roster' ? 'Professional Roster' : `${activeSectionId}s`}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#8E8484' }}>Manage your studio's professional team and roles.</p>
          </div>
          <AdminAddButton label="Add Member" onClick={() => onAdd(props)} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {list.map((member, idx) => {
          const actualIdx = members.findIndex(m => m.id === member.id);
          return (
            <div 
              key={member.id || idx} 
              className="hub-field-card hub-hover-group" 
              style={{ padding: '24px', cursor: 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="team-photo-area" style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '20px', backgroundColor: '#f9f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a1a26', fontWeight: 800, fontSize: '1.5rem' }}>
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(member, actualIdx, props); }}
                    className={isMobile ? "" : "reveal-on-hover"}
                    style={{ position: 'absolute', bottom: -5, right: -5, width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff', border: '1.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a1a26', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4a1a26', margin: 0 }}>{member.name || 'New Member'}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#8E8484', fontWeight: 600, margin: 0 }}>{member.role || 'Title/Role'}</p>
                </div>
                <button 
                  className={isMobile ? "" : "reveal-on-hover"} 
                  onClick={(e) => { e.stopPropagation(); onDelete(actualIdx); }} 
                  style={{ border: 'none', background: 'transparent', color: '#e53935', cursor: 'pointer', padding: '12px', opacity: 0.6 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamManager() {
  const isMobile = useMobile();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('roster');
  const [draftMember, setDraftMember] = useState({ name: "", role: "Nail Artist", image: null });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const docSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
      if (docSnap.exists()) {
        setMembers(docSnap.data().team?.members || []);
      }
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'site_content', 'landing_page'), { 'team.members': members });
      alert("✅ Team updated!");
    } catch {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = (idx) => {
    if (idx === -1) return;
    if (!window.confirm("Delete this member?")) return;
    setMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const confirmAddMember = (closePopup) => {
    if (!draftMember.name || !draftMember.role || !draftMember.image) {
      alert("Please complete all fields.");
      return;
    }
    
    setMembers(prev => {
      const newList = [...prev];
      if (isEditing) {
        newList[editingIndex] = draftMember;
      } else {
        newList.push({ ...draftMember, id: Date.now().toString() });
      }
      return newList;
    });
    
    closePopup();
    setDraftMember({ name: "", role: "Nail Artist", image: null });
  };

  const roles = [...new Set(members.map(m => m.role))];

  const sections = [
    { 
      id: 'roster', 
      label: 'Professional Roster', 
      description: 'Unified view of all active team members.',
      icon: <Users size={20} />,
      status: `${members.length} Active`,
      component: (
        <TeamGrid 
          list={members} 
          members={members} 
          activeSectionId="roster" 
          isMobile={isMobile}
          onDelete={deleteMember}
          onAdd={() => {
            setIsEditing(false);
            setDraftMember({ name: "", role: "Nail Artist", image: null });
            openPopup();
          }}
          onEdit={(member, idx) => {
            setIsEditing(true);
            setEditingIndex(idx);
            setDraftMember({ ...member });
            openPopup();
          }}
        />
      )
    },
    ...roles.map(role => ({
      id: role,
      label: `${role}s`,
      description: `Filtering team by ${role} specialization.`,
      icon: <UserCheck size={20} />,
      status: 'Specialist',
      component: (
        <TeamGrid 
          list={members.filter(m => m.role === role)} 
          members={members} 
          activeSectionId={role} 
          isMobile={isMobile}
          onDelete={deleteMember}
          onAdd={() => {
            setIsEditing(false);
            setDraftMember({ name: "", role: role, image: null });
            openPopup();
          }}
          onEdit={(member, idx) => {
            setIsEditing(true);
            setEditingIndex(idx);
            setDraftMember({ ...member });
            openPopup();
          }}
        />
      )
    }))
  ];

  if (loading && members.length === 0) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Studio Roster...</p>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="status-header-grid">
        <div className="status-card sage">
          <span className="status-label">Studio Roster</span>
          <div className="status-value">{members.length} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Members</span></div>
          <div className="status-badge">Active</div>
        </div>
        <div className="status-card mustard">
          <span className="status-label">Role Diversity</span>
          <div className="status-value">{roles.length} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Roles</span></div>
          <div className="status-badge">Professional</div>
        </div>
        <div className="status-card periwinkle">
          <span className="status-label">Sync Status</span>
          <div className="status-value">Verified</div>
          <div className="status-badge"><ShieldCheck size={14} /></div>
        </div>
      </div>

      {isMobile ? (
        <div style={{ padding: '0', paddingBottom: '100px' }}>
          <TeamGrid 
            list={members} 
            members={members} 
            activeSectionId="roster" 
            isMobile={true}
            onDelete={deleteMember}
            onAdd={() => {
              setIsEditing(false);
              setDraftMember({ name: "", role: "Nail Artist", image: null });
              openPopup();
            }}
            onEdit={(member, idx) => {
              setIsEditing(true);
              setEditingIndex(idx);
              setDraftMember({ ...member });
              openPopup();
            }}
            openPopup={openPopup}
            closePopup={closePopup}
          />

          <div className={`hub-popup-overlay ${isPopupOpen ? 'open' : ''}`} onClick={closePopup}>
            <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
              <AdminUploadLayout
                initialImage={isEditing ? draftMember.image : null}
                onUploadSuccess={(url) => setDraftMember(prev => ({ ...prev, image: url }))}
                onSave={() => confirmAddMember(closePopup)}
                onDiscard={closePopup}
                saveLabel={isEditing ? "Update Member" : "Add Member"}
              >
                <input 
                  className="aul-field"
                  placeholder="Professional Name"
                  value={draftMember.name}
                  onChange={(e) => setDraftMember(prev => ({ ...prev, name: e.target.value }))}
                />
                <input 
                  className="aul-field"
                  placeholder="Professional Role"
                  value={draftMember.role}
                  onChange={(e) => setDraftMember(prev => ({ ...prev, role: e.target.value }))}
                />
              </AdminUploadLayout>
            </div>
          </div>

          <HubActionPill
            onSave={handleSave}
            onDiscard={fetchTeam}
            isSaving={saving}
            hasChanges={true}
            saveLabel="Save Changes"
          />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <AdminMobileLayout 
            title="Team"
            description="Manage your studio's professional team and work titles."
            sections={sections}
            activeSectionId={activeSectionId}
            onSectionChange={setActiveSectionId}
            onSave={handleSave}
            onDiscard={fetchTeam}
            isSaving={saving}
            hasChanges={true}
            openPopup={openPopup}
            closePopup={closePopup}
          />
          
          <div className={`hub-popup-overlay desktop ${isPopupOpen ? 'open' : ''}`} onClick={closePopup}>
            <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
              <AdminUploadLayout
                initialImage={isEditing ? draftMember.image : null}
                onUploadSuccess={(url) => setDraftMember(prev => ({ ...prev, image: url }))}
                onSave={() => confirmAddMember(closePopup)}
                onDiscard={closePopup}
                saveLabel={isEditing ? "Update Member" : "Add Member"}
              >
                <input 
                  className="aul-field"
                  placeholder="Professional Name"
                  value={draftMember.name}
                  onChange={(e) => setDraftMember(prev => ({ ...prev, name: e.target.value }))}
                />
                <input 
                  className="aul-field"
                  placeholder="Professional Role"
                  value={draftMember.role}
                  onChange={(e) => setDraftMember(prev => ({ ...prev, role: e.target.value }))}
                />
              </AdminUploadLayout>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManager;
