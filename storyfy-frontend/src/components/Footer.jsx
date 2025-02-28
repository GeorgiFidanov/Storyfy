function Footer() {
  return (
    <footer className="app-footer">
      <p>
        Storyfy uses Spotify's audio features to create unique visualizations.
        Each image is generated using characteristics like tempo, energy, and valence.
      </p>
      <div className="footer-links">
        <a href="https://developer.spotify.com/documentation/web-api" target="_blank" rel="noopener noreferrer">
          Powered by Spotify API
        </a>
      </div>
    </footer>
  );
}

export default Footer; 