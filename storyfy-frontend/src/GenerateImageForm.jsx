import { useEffect, useState } from 'react';
import axios from 'axios';

function GenerateImageForm() {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [tracks, setTracks] = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/playlists', { withCredentials: true });
        setPlaylists(response.data.playlists);
      } catch (err) {
        setError('Failed to fetch playlists');
      }
    };
    fetchPlaylists();
  }, []);

  const fetchTracks = async (playlistId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/playlist/${playlistId}`, { withCredentials: true });
      setTracks(response.data.tracks);
    } catch (err) {
      setError('Failed to fetch tracks');
    }
  };

  const handlePlaylistChange = (e) => {
    setSelectedPlaylist(e.target.value);
    setTracks([]);
    setSelectedSong('');
    fetchTracks(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/generate',
        { song_name: selectedSong },
        { withCredentials: true }
      );

      setImageData(response.data.image_data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div>
      <h1>Generate Image from Song</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Select Playlist:</label>
          <select value={selectedPlaylist} onChange={handlePlaylistChange}>
            <option value="">-- Select Playlist --</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Select Song:</label>
          <select value={selectedSong} onChange={(e) => setSelectedSong(e.target.value)} disabled={!tracks.length}>
            <option value="">-- Select Song --</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.name}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={!selectedSong}>
          Generate Image
        </button>
      </form>

      {imageData && (
        <div>
          <h3>Generated Image</h3>
          <img src={`data:image/png;base64,${imageData}`} alt="Generated Song Image" />
        </div>
      )}
    </div>
  );
}

export default GenerateImageForm;
