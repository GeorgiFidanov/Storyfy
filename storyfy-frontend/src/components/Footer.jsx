import { useFooter } from '../context/FooterContext';

function Footer() {
  const { footerType, failedPlaylists } = useFooter();

  if (footerType === 'none') return null;

  const renderFooterContent = () => {
    switch (footerType) {
      case 'login':
        return (
          <>
            <h3>Features</h3>
            <ul>
              <li>Connect with your Spotify account</li>
              <li>Generate unique AI visualizations from your music</li>
              <li>Analyze audio features of your favorite tracks</li>
              <li>Create and share visual stories from your playlists</li>
            </ul>
          </>
        );

      case 'library':
        return (
          <>
            <div className="legal-info">
              <p>© 2024 Storyfy. All rights reserved.</p>
              <p>Powered by Spotify API and Stable Diffusion</p>
            </div>
            {failedPlaylists.length > 0 && (
              <div className="failed-playlists-section">
                <h4>Failed to load ({failedPlaylists.length} items):</h4>
                <ul>
                  {failedPlaylists.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );

      default:
        return (
          <p>
            Storyfy uses Spotify's audio features to create unique visualizations.
            Each image is generated using characteristics like tempo, energy, and valence.
          </p>
        );
    }
  };

  return (
    <footer className="app-footer">
      {renderFooterContent()}
      <div className="footer-links">
        <a href="https://developer.spotify.com/documentation/web-api" target="_blank" rel="noopener noreferrer">
          Powered by Spotify API
        </a>
      </div>
    </footer>
  );
}

export default Footer; 