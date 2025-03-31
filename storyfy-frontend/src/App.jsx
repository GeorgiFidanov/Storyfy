import './styles/App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { FooterProvider } from './context/FooterContext';
import PlaylistSelector from './components/PlaylistSelector';
import Gallery from './components/Gallery';
import LoginPage from './components/LoginPage';
import UserMenu from './components/UserMenu';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/check-auth', {
        withCredentials: true
      });
      setIsAuthenticated(true);
      setUserProfile(response.data.user);
    } catch (error) {
      setIsAuthenticated(false);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
      setIsAuthenticated(false);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <FooterProvider>
        {isAuthenticated && <UserMenu userProfile={userProfile} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <LoginPage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/gallery" 
            element={
              isAuthenticated ? 
                <Gallery userProfile={userProfile} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <PlaylistSelector userProfile={userProfile} /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </FooterProvider>
    </Router>
  );
}

export default App; 