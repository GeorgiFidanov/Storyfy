import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { useFooter } from '../context/FooterContext';
import LoadingPage from './LoadingPage';

function PlaylistSelector() {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [failedPlaylists, setFailedPlaylists] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showingPlaylistView, setShowingPlaylistView] = useState(false);
  const { setFooterType } = useFooter();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setFooterType('library');
    
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/playlists', {
          withCredentials: true
        });
        
        if (Array.isArray(response.data)) {
          setPlaylists(response.data);
          const failed = response.data.filter(p => !p.images?.[0]?.url || !p.name);
          if (failed.length > 0) {
            setFailedPlaylists(failed.map(p => p.name || `Playlist ID: ${p.id}`));
          }
        } else {
          setError('Received invalid playlist data format');
        }
      } catch (err) {
        setError('Failed to fetch playlists: ' + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = async (playlist) => {
    setSelectedPlaylist(playlist);
    setSelectedTrack(null);
    setGeneratedImage(null);
    setLoadingTracks(true);
    setShowingPlaylistView(true); // Show playlist view
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/playlist_tracks?playlist_id=${playlist.id}`,
        { withCredentials: true }
      );
      setTracks(response.data);
    } catch (err) {
      setError('Failed to fetch tracks');
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleBackToPlaylists = () => {
    setShowingPlaylistView(false);
    setSelectedPlaylist(null);
    setSelectedTrack(null);
    setGeneratedImage(null);
  };

  const handleTrackClick = (track) => {
    setSelectedTrack(track);
    setGeneratedImage(null); // Clear previous image
  };

  const handleGenerateImage = async () => {
    if (!selectedTrack) return;
    
    setIsGenerating(true);
    setFooterType('none');
    
    try {
        const response = await axios.post(
            'http://localhost:5000/api/generate_image',
            { 
                track_info: {
                    name: selectedTrack.name,
                    artist_name: selectedTrack.artist_name,
                    album_name: selectedTrack.album_name,
                    energy: selectedTrack.energy,
                    danceability: selectedTrack.danceability,
                    valence: selectedTrack.valence,
                    acousticness: selectedTrack.acousticness,
                    instrumentalness: selectedTrack.instrumentalness
                }
            },
            { withCredentials: true }
        );
        
        if (response.data.image_data) {
            setGeneratedImage(response.data.image_data);
            console.log('Generated prompt:', response.data.prompt);
        }
    } catch (err) {
        console.error('Failed to generate image:', err);
        setError('Failed to generate image: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsGenerating(false);
      setFooterType('library');
    }
  };

  if (isGenerating) {
    return <LoadingPage />;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="loading">Loading your playlists...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="content-container">
        {error && (
          <div className="error-message">
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {!showingPlaylistView ? (
          <>
            <h2>Your Spotify Playlists ({playlists.length})</h2>
            <div className="playlists-container">
              {playlists
                .filter(playlist => playlist.images?.[0]?.url && playlist.name)
                .map((playlist) => (
                  <div
                    key={playlist.id}
                    className="playlist-card"
                    onClick={() => handlePlaylistClick(playlist)}
                  >
                    <img 
                      src={playlist.images[0].url} 
                      alt={playlist.name}
                    />
                    <h3>{playlist.name}</h3>
                    <p>{playlist.tracks.total} tracks</p>
                  </div>
                ))}
            </div>
            
            {failedPlaylists.length > 0 && (
              <div className="failed-playlists-section">
                <h3>Playlists that failed to load ({failedPlaylists.length}):</h3>
                <ul>
                  {failedPlaylists.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          // Playlist Tracks View
          <div className="playlist-view">
            <div className="playlist-header">
              <button className="back-button" onClick={handleBackToPlaylists}>
                ← Back to Playlists
              </button>
              <div className="playlist-info">
                <img 
                  src={selectedPlaylist.images[0].url} 
                  alt={selectedPlaylist.name}
                  className="playlist-cover"
                />
                <div className="playlist-details">
                  <h2>{selectedPlaylist.name}</h2>
                  <p>{tracks.length} tracks</p>
                </div>
              </div>
            </div>

            {loadingTracks ? (
              <div className="loading">Loading tracks...</div>
            ) : (
              <div className="tracks-list">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`track-row ${selectedTrack?.id === track.id ? 'selected' : ''}`}
                    onClick={() => handleTrackClick(track)}
                  >
                    <div className="track-number">{index + 1}</div>
                    <div className="track-info">
                      <div className="track-image-and-details">
                        {track.album_image && (
                          <img 
                            src={track.album_image} 
                            alt={track.album_name}
                            className="track-album-image" 
                          />
                        )}
                        <div className="track-name-artist">
                          <h4>{track.name}</h4>
                          <p>{track.artist_name}</p>
                        </div>
                      </div>
                      <div className="track-album">
                        {track.album_name}
                      </div>
                    </div>
                    {selectedTrack?.id === track.id && (
                      <button 
                        className="generate-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateImage();
                        }}
                        disabled={!track.energy}
                      >
                        {track.energy ? 'Generate Visualization' : 'No Audio Features Available'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {generatedImage && (
              <div className="generated-image-section">
                <h3>Generated Visualization</h3>
                <div className="generated-image">
                  <img 
                    src={`data:image/png;base64,${generatedImage}`} 
                    alt="Generated visualization" 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default PlaylistSelector; 