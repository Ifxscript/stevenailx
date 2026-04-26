import { useState, useEffect } from 'react';

/**
 * UserAvatar Component
 * Centralized logic for displaying user profile photos with initials fallback.
 * Automatically handles broken image links (imgError) and missing photoURLs.
 */
function UserAvatar({ user, className = "", style = {} }) {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the user object or photoURL changes
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  const hasPhoto = user?.photoURL && !imgError;
  const initial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'S';

  return (
    <div 
      className={`user-avatar-container ${className}`} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '50%',
        ...style 
      }}
    >
      {hasPhoto ? (
        <img 
          src={user.photoURL} 
          alt={user.displayName || "User"} 
          className="avatar-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="avatar-initials">{initial}</span>
      )}
    </div>
  );
}

export default UserAvatar;
