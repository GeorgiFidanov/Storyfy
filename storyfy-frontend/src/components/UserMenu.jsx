import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function UserMenu({ userProfile, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
    setIsOpen(false);
  };

  return (
    <div className="user-menu">
      <button 
        className="user-menu-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <img 
          src={userProfile?.images?.[0]?.url || '/default-avatar.png'} 
          alt={userProfile?.display_name || 'User profile'} 
          className="user-avatar"
        />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <img 
              src={userProfile?.images?.[0]?.url || '/default-avatar.png'} 
              alt={userProfile?.display_name || 'User profile'} 
              className="user-avatar-large"
            />
            <div className="user-details">
              <h3>{userProfile?.display_name}</h3>
              <p>{userProfile?.email}</p>
            </div>
          </div>
          
          <div className="menu-items">
            <Link 
              to="/" 
              className="menu-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="icon">🏠</span>
              Home
            </Link>
            <Link 
              to="/gallery" 
              className="menu-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="icon">🖼️</span>
              My Generated Images
            </Link>
            <a 
              href={userProfile?.external_urls?.spotify} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="menu-item"
            >
              <span className="icon">🎵</span>
              Spotify Profile
            </a>
            <button 
              onClick={handleLogout} 
              className="menu-item logout-button"
            >
              <span className="icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu; 