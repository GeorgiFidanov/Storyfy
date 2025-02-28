function LoginPage({ onLogin }) {
  return (
    <div className="login-container">
      <h1>Welcome to Storyfy</h1>
      <p>Connect with Spotify to start generating images from your music</p>
      <button className="login-button" onClick={onLogin}>
        Login with Spotify
      </button>
    </div>
  );
}

export default LoginPage; 