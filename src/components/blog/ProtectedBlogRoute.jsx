import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard for the Blog Editor portal.
 * Only allows admins and marketers. Everyone else → homepage.
 */
function ProtectedBlogRoute({ children }) {
  const { currentUser, isAdmin, isMarketer } = useAuth();

  if (!currentUser || (!isAdmin && !isMarketer)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedBlogRoute;
