import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { X, UserRound, CalendarHeart, Phone, LogOut, ChevronRight, Check } from 'lucide-react';
import './UserProfileDrawer.css';

function UserProfileDrawer({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Fetch phone number
      if (currentUser) {
        getDoc(doc(db, 'users', currentUser.uid))
          .then(docSnap => {
            if (docSnap.exists() && docSnap.data().phone) {
              setPhoneNumber(docSnap.data().phone);
            }
          })
          .catch(console.error);
      }
    } else {
      document.body.style.overflow = 'unset';
      setIsEditingPhone(false);
      setPhoneSaved(false);
    }
  }, [isOpen, currentUser]);

  const handleLogout = async () => {
    onClose();
    setTimeout(() => {
      logout();
      navigate('/');
    }, 300);
  };

  const handleAppointmentsClick = () => {
    onClose();
    navigate('/bookings');
  };

  const handleSavePhone = async () => {
    if (!currentUser || !phoneNumber.trim()) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: currentUser.displayName || '',
        email: currentUser.email,
        phone: phoneNumber.trim(),
        photoURL: currentUser.photoURL || '',
      }, { merge: true });
      setPhoneSaved(true);
      setTimeout(() => {
        setIsEditingPhone(false);
        setPhoneSaved(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to save phone:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <AnimatePresence>
      <div className="profile-backdrop" onClick={onClose}>
        <motion.div
          className="profile-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="profile-header">
            <h2 className="profile-title">Profile</h2>
            <button className="profile-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="profile-content">
            {/* Top User Profile Header (Option B) */}
            <div className="user-profile-header">
              <div className="user-avatar-wrapper">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="user-avatar-hero"
                    onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('sidebar-avatar-fallback').style.display = 'flex'; }}
                  />
                )}
                <div id="sidebar-avatar-fallback" className="user-avatar-hero fallback flex items-center justify-center bg-gray-200" style={{ display: currentUser.photoURL ? 'none' : 'flex' }}>
                  <UserRound size={40} color="#888" />
                </div>
              </div>
              <div className="user-info-hero">
                <span className="user-name-hero">{currentUser.displayName || 'Client'}</span>
              </div>
            </div>

            {/* Account Settings */}
            <div className="profile-list-card">

              {/* Phone Edit Inline Flow */}
              {isEditingPhone ? (
                <div className="phone-edit-inline">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +234 801 234 5678"
                    autoFocus
                  />
                  <div className="phone-edit-actions">
                    <button className="btn-cancel" onClick={() => setIsEditingPhone(false)}>Cancel</button>
                    <button className="btn-save" onClick={handleSavePhone} disabled={isSaving}>
                      {phoneSaved ? <Check size={16} /> : (isSaving ? 'Saving...' : 'Save')}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="profile-list-item" onClick={() => setIsEditingPhone(true)}>
                  <div className="profile-item-left">
                    <Phone size={18} className="profile-item-icon" />
                    <span className="profile-item-label">Edit phone number</span>
                  </div>
                  <div className="profile-item-value">
                    <ChevronRight size={16} color="#ccc" />
                  </div>
                </button>
              )}

            </div>
            {/* </div> */} 

            {/* Application */}
            <div>
              <div className="profile-list-card">
                <button className="profile-list-item" onClick={handleAppointmentsClick}>
                  <div className="profile-item-left">
                    <CalendarHeart size={18} className="profile-item-icon" />
                    <span className="profile-item-label">My Appointments</span>
                  </div>
                  <ChevronRight size={16} color="#ccc" />
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: 'auto' }}>
              <div className="profile-list-card">
                <button className="profile-list-item" onClick={handleLogout}>
                  <div className="profile-item-left">
                    <LogOut size={18} color="#e74c3c" />
                    <span className="profile-item-label" style={{ color: '#e74c3c' }}>Log Out</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UserProfileDrawer;
