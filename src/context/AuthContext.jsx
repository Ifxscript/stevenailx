import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
  GoogleAuthProvider,
  signOut 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

// Safety fallback — you can never be locked out of the dashboard
const FALLBACK_ADMINS = [
  'ianekwe7@gmail.com',
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [adminEmails, setAdminEmails] = useState(FALLBACK_ADMINS);
  const [marketerEmails, setMarketerEmails] = useState([]);

  // 1. Fetch live admin roster once on mount
  useEffect(() => {
    const fetchAdminRoster = async () => {
      try {
        const docRef = doc(db, 'site_content', 'landing_page');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const security = docSnap.data().security || {};
          const liveAdmins = security.adminEmails || [];
          const liveMarketers = security.marketerEmails || [];
          
          // Ensure fallback is ALWAYS included for safety without mutating the source
          const finalAdmins = liveAdmins.includes(FALLBACK_ADMINS[0]) 
            ? liveAdmins 
            : [...liveAdmins, FALLBACK_ADMINS[0]];
            
          setAdminEmails(finalAdmins);
          setMarketerEmails(liveMarketers);
        }
      } catch (err) {
        console.error("Error fetching admin roster:", err);
      }
    };
    fetchAdminRoster();
  }, []);

  useEffect(() => {
    // 2. Check for Magic Link on Mount
    const handleMagicLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }
        try {
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          window.location.hash = '';
        } catch (error) {
          console.error("Magic link error:", error);
        }
      }
    };

    handleMagicLink();

    // 3. Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const isAdminUser = user ? adminEmails.includes(user.email) || FALLBACK_ADMINS.includes(user.email) : false;
      const isMarketerUser = user ? marketerEmails.includes(user.email) : false;
      
      setIsAdmin(isAdminUser);
      if (isMarketerUser) setUserRole('marketer');
      
      if (user) {
        // Sync user to Firestore users collection
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString()
          };
          
          if (!snap.exists()) {
            userData.createdAt = new Date().toISOString();
            await setDoc(userRef, userData);
          } else {
            // Read role from existing doc
            const existingData = snap.data();
            setUserRole(existingData.role || null);
            // Update last login
            await setDoc(userRef, { 
              lastLogin: userData.lastLogin,
              // Refresh photo/name in case they changed
              name: userData.name,
              photoURL: userData.photoURL
            }, { merge: true });
          }
        } catch (err) {
          console.error("Error syncing user to Firestore:", err);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [adminEmails]); // Only re-run auth listener tag when roster is fetched or updated

  // Admin/Marketer login — Google popup with role check
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const isAdminUser = adminEmails.includes(result.user.email) || FALLBACK_ADMINS.includes(result.user.email);
    const isMarketerUser = marketerEmails.includes(result.user.email);
    
    // Check if user has a marketer role in Firestore
    let role = isMarketerUser ? 'marketer' : null;
    try {
      const userSnap = await getDoc(doc(db, 'users', result.user.uid));
      if (userSnap.exists()) {
        role = userSnap.data().role || role;
      }
    } catch (e) {
      console.error('Error reading user role:', e);
    }
    
    if (!isAdminUser && role !== 'marketer') {
      await signOut(auth);
      throw new Error("You are not authorized to access this portal.");
    }
    
    setUserRole(role);
    return { ...result, role, isAdminUser };
  };

  // Client login — Google popup, no whitelist (anyone can book)
  const loginAsClient = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  };

  const sendMagicLink = (email) => {
    const actionCodeSettings = {
      url: window.location.origin + '/admin/login',
      handleCodeInApp: true,
    };
    window.localStorage.setItem('emailForSignIn', email);
    return sendSignInLinkToEmail(auth, email, actionCodeSettings);
  };

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('upcoming');

  const openDashboard = (tab = 'upcoming') => {
    setDashboardTab(tab);
    setIsDashboardOpen(true);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAdmin, 
      userRole,
      isMarketer: userRole === 'marketer',
      isClient: !!currentUser && !isAdmin,
      isDashboardOpen,
      setIsDashboardOpen,
      dashboardTab,
      openDashboard,
      loginWithGoogle, 
      loginAsClient,
      sendMagicLink, 
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
