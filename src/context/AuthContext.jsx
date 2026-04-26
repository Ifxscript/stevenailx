import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  const [adminEmails, setAdminEmails] = useState(FALLBACK_ADMINS);

  // 1. Fetch live admin roster once on mount
  useEffect(() => {
    const fetchAdminRoster = async () => {
      try {
        const docRef = doc(db, 'site_content', 'landing_page');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const security = docSnap.data().security || {};
          const liveAdmins = security.adminEmails || [];
          // Ensure fallback is ALWAYS included for safety without mutating the source
          const finalAdmins = liveAdmins.includes(FALLBACK_ADMINS[0]) 
            ? liveAdmins 
            : [...liveAdmins, FALLBACK_ADMINS[0]];
          setAdminEmails(finalAdmins);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(user ? adminEmails.includes(user.email) || FALLBACK_ADMINS.includes(user.email) : false);
      setLoading(false);
    });

    return unsubscribe;
  }, [adminEmails]); // Only re-run auth listener tag when roster is fetched or updated

  // Admin login — Google popup with whitelist check
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (!adminEmails.includes(result.user.email) && !FALLBACK_ADMINS.includes(result.user.email)) {
      await signOut(auth);
      throw new Error("You are not authorized to access the admin dashboard.");
    }
    return result;
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
