import './styles/App.css';
import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import PlaylistSelector from './components/PlaylistSelector';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        console.log('Checking login status...');
        const response = await fetch('http://localhost:5000/api/playlists', {
          credentials: 'include'
        });
        console.log('Login check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Received playlists:', data);
          setIsLoggedIn(true);
        } else {
          const errorData = await response.json();
          console.error('Login check failed:', errorData);
          setIsLoggedIn(false);
          setError(errorData.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('Login check error:', error);
        setIsLoggedIn(false);
        setError('Failed to check login status');
      } finally {
        setIsLoading(false);
      }
    };

    console.log('Current URL:', window.location.href);
    checkLoginStatus();
  }, []);

  console.log('App render state:', { isLoggedIn, isLoading, error });

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
        <button className="login-button" onClick={handleLogin}>
          Try logging in again
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="content-container">
          <h2>Your Spotify Playlists</h2>
          <PlaylistSelector />
        </div>
      )}
    </div>
  );
}

export default App; 