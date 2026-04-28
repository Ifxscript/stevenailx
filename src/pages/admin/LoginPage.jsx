import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const { sendMagicLink, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const handleGoogleLogin = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      const result = await loginWithGoogle();
      // Role-based redirect
      if (result.role === 'marketer' && !result.isAdminUser) {
        navigate('/blog-editor');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Unauthorized access.');
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError('Check your email address and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="login-header">
          <div className="brand-badge">
            <Sparkles size={16} />
            <span>STEVENAILX EXCLUSIVE</span>
          </div>
          <h1>Studio Access</h1>
          <p>The gateway to your bespoke management suite.</p>
        </header>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div 
              key="auth-options"
              className="auth-options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error && <div className="login-error">{error}</div>}

              <button 
                className="google-login-btn" 
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="login-divider">
                <span>or use magic link</span>
              </div>

              <form onSubmit={handleMagicLinkSubmit} className="login-form">
                <div className="input-group">
                  <label htmlFor="email">Work Email</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input 
                      type="email" 
                      id="email"
                      placeholder="studio@stevenailx.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="login-button secondary" 
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Sign in with Email</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success-message"
              className="login-success-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="success-icon-wrapper">
                <CheckCircle2 size={48} className="success-icon" />
              </div>
              <h3>Magic Link Sent!</h3>
              <p>Check your inbox for <strong>{email}</strong> to enter the studio.</p>
              <button onClick={() => setSent(false)} className="resend-link">
                Didn't get it? Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="login-footer">
          <p>&copy; 2026 STEVENAILX. Professional Grade Management.</p>
        </footer>
      </motion.div>

      <div className="login-background">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-overlay"></div>
      </div>
    </div>
  );
}

export default LoginPage;
