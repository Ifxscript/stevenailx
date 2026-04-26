import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import UserAvatar from '../UserAvatar';

function BookingAuth() {
  const { currentUser, loginAsClient } = useAuth();
  const { nextStep } = useBooking();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsPhone, setNeedsPhone] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginAsClient();
      // Check if user profile exists with phone
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists() && userDoc.data().phone) {
        // Has phone, skip to next
        nextStep();
      } else {
        setNeedsPhone(true);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      setError('Phone number is required for booking confirmations.');
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: currentUser.displayName || '',
        email: currentUser.email,
        phone: phone.trim(),
        photoURL: currentUser.photoURL || '',
        createdAt: new Date().toISOString(),
      }, { merge: true });
      nextStep();
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-check for phone number if already logged in
  useEffect(() => {
    let isMounted = true;
    if (currentUser && !needsPhone) {
      const checkPhone = async () => {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (isMounted) {
          if (userDoc.exists() && userDoc.data().phone) {
            nextStep();
          } else {
            setNeedsPhone(true);
          }
        }
      };
      checkPhone();
    }
    return () => { isMounted = false; };
  }, [currentUser, needsPhone, nextStep]);

  if (currentUser && !needsPhone) {
    return <div className="step-loading"><Loader2 className="animate-spin" size={20} /> Checking account...</div>;
  }

  return (
    <div className="step-container auth-step">
      {!needsPhone ? (
        <>
          <div className="step-header centered">
            <div className="auth-icon">👤</div>
            <h3>Sign in to continue</h3>
            <p>We need your account to save your booking and send confirmations.</p>
          </div>

          <button className="google-login-btn" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-note">
            We only use your Google account for identity — we never post anything.
          </p>
        </>
      ) : (
        <>
          <div className="step-header centered">
            <div className="auth-icon">📞</div>
            <h3>Almost there!</h3>
            <p>Add your phone number so we can send booking confirmations via WhatsApp.</p>
          </div>

          <div className="auth-profile-card">
            <UserAvatar 
              user={currentUser} 
              className="auth-avatar" 
            />
            <div>
              <span className="auth-name">{currentUser?.displayName}</span>
              <span className="auth-email">{currentUser?.email}</span>
            </div>
          </div>

          <div className="phone-input-group">
            <label>Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 801 234 5678"
              className="phone-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="step-footer">
            <button className="step-continue-btn" onClick={handleSavePhone} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Continue to Review'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default BookingAuth;
