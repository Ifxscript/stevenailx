import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, onSnapshot } from 'firebase/firestore';
import { 
  Loader2, Search, Calendar, ChevronRight, X, User, Phone, Mail, Clock, CalendarCheck, Filter
} from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import AdminSectionDescription from './AdminSectionDescription';
import { useMobile } from '../../hooks/useMobile';
import { formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import './UsersManager.css';

function UsersList({ users, isMobile, openPopup, closePopup, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'bookings'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search filter
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      result = result.filter(u => 
        (u.displayName || u.name || '').toLowerCase().includes(lowerQuery) || 
        (u.email || '').toLowerCase().includes(lowerQuery)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return b.signupDate - a.signupDate;
      } else {
        return b.bookingCount - a.bookingCount;
      }
    });

    return result;
  }, [users, searchTerm, sortBy]);

  const showUserProfile = (user) => {
    openPopup(
      <div className="user-profile-drawer">
        <div className="drawer-header-row">
          <button 
            onClick={closePopup} 
            className="drawer-back-btn"
          >
            <ChevronRight style={{ transform: 'rotate(180deg)' }} size={24} />
          </button>
          <div className="drawer-user-info">
            <div className="drawer-avatar light-avatar">
              {(user.displayName || user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="drawer-name">{user.displayName || user.name || 'Unknown User'}</h3>
              <p className="drawer-signup">Joined {formatDisplayDate(user.signupDate.toISOString().split('T')[0])}</p>
            </div>
          </div>
        </div>
        
        <div className="drawer-contact-info-flat">
          <div className="contact-row">
            <Mail size={16} />
            <a href={`mailto:${user.email}`}>{user.email}</a>
          </div>
          {user.phone && (
            <div className="contact-row">
              <Phone size={16} />
              <a href={`tel:${user.phone}`}>{user.phone}</a>
            </div>
          )}
        </div>

        <div className="drawer-bookings-section">
          <h4 className="section-title">Booking History ({user.bookings.length})</h4>
          {user.bookings.length === 0 ? (
            <div className="empty-bookings">No bookings found for this user.</div>
          ) : (
            <div className="drawer-booking-list">
              {user.bookings.map(b => (
                <div key={b.docId || b.id} className="drawer-booking-card">
                  <div className="booking-card-header">
                    <span className="booking-date">{formatDisplayDate(b.date)} at {formatDisplayTime(b.timeSlot)}</span>
                    <span className={`booking-status status-${b.status}`}>{b.status}</span>
                  </div>
                  <div className="booking-services">
                    {b.services?.map(s => s.name).join(', ') || 'Nail Service'}
                  </div>
                  <div className="booking-price">
                    ₦{b.totalPrice?.toLocaleString() || '0'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="users-manager-content">
      <div className="users-controls">
        {isMobile && <AdminSectionDescription text="Manage signed-up users and view their complete booking history." />}
        
        {!isMobile && (
          <div className="editor-header" style={{ marginBottom: '20px' }}>
            <h2>Users Directory</h2>
            <p>Manage signed-up users and view their complete booking history.</p>
          </div>
        )}

        <div className="users-filters">
          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="users-search-input"
            />
          </div>
          
          <div className="users-filter-wrapper" ref={filterRef}>
            <button 
              className="users-filter-icon-btn"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Open sorting menu"
            >
              <Filter size={20} />
            </button>

            {isFilterOpen && (
              <div className="users-filter-dropdown">
                <button 
                  className={`filter-option ${sortBy === 'recent' ? 'active' : ''}`}
                  onClick={() => { setSortBy('recent'); setIsFilterOpen(false); }}
                >
                  <span>Most Recent</span>
                  {sortBy === 'recent' && <CalendarCheck size={14} />}
                </button>
                <button 
                  className={`filter-option ${sortBy === 'bookings' ? 'active' : ''}`}
                  onClick={() => { setSortBy('bookings'); setIsFilterOpen(false); }}
                >
                  <span>Most Bookings</span>
                  {sortBy === 'bookings' && <CalendarCheck size={14} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="users-list-container">
        {isLoading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" />
            <span>Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <User size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p>No users found matching your search.</p>
          </div>
        ) : (
          <div className="users-list">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className="user-row-flat hub-hover-group"
                onClick={() => showUserProfile(user)}
              >
                <div className="user-row-left">
                  <div className="user-avatar-small">
                    {(user.displayName || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.displayName || user.name || 'Unknown User'}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-booking-badge">{user.bookingCount} BOOKING{user.bookingCount !== 1 ? 'S' : ''}</div>
                  </div>
                </div>
                
                <div className="user-row-right">
                  <ChevronRight size={18} className="row-arrow" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersManager() {
  const isMobile = useMobile();
  const [bookings, setBookings] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [popup, setPopup] = useState({ isOpen: false, content: null });
  const openPopup = (content) => setPopup({ isOpen: true, content });
  const closePopup = () => setPopup({ isOpen: false, content: null });

  useEffect(() => {
    setIsLoading(true);
    
    const unsubBookings = onSnapshot(query(collection(db, 'bookings')), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(bList);
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      const uList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawUsers(uList);
      setIsLoading(false);
    });

    return () => {
      unsubBookings();
      unsubUsers();
    };
  }, []);

  const users = useMemo(() => {
    return rawUsers.map(u => {
      const userBookings = bookings.filter(b => b.clientId === u.id);
      userBookings.sort((a, b) => {
        const dateA = new Date(`${a.date}T${(a.timeSlot || '').split(' - ')[0] || '00:00'}`);
        const dateB = new Date(`${b.date}T${(b.timeSlot || '').split(' - ')[0] || '00:00'}`);
        return dateB - dateA;
      });

      return {
        ...u,
        bookings: userBookings,
        bookingCount: userBookings.length,
        signupDate: u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || Date.now())
      };
    });
  }, [rawUsers, bookings]);

  const sections = [
    {
      id: 'directory',
      label: 'All Users',
      icon: <User size={18} />,
      component: (
        <UsersList 
          users={users} 
          isMobile={isMobile}
          isLoading={isLoading}
          openPopup={openPopup}
          closePopup={closePopup}
        />
      )
    }
  ];

  return (
    <div className="manager-container">
      {isMobile ? (
        <div style={{ padding: '0', paddingBottom: '100px' }}>
          <UsersList 
            users={users} 
            isMobile={isMobile}
            isLoading={isLoading}
            openPopup={openPopup}
            closePopup={closePopup}
          />
          <div className={`hub-popup-overlay ${popup.isOpen ? 'open' : ''}`} onClick={closePopup}>
            <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
              {popup.content}
            </div>
          </div>
        </div>
      ) : (
        <AdminMobileLayout
          title="Users"
          description="Manage signed-up users and view their complete booking history."
          sections={sections}
          activeSectionId="directory"
          onSectionChange={() => {}}
          hasChanges={false}
          onSave={() => {}}
          onDiscard={() => {}}
          isSaving={false}
        />
      )}
    </div>
  );
}

export default UsersManager;
