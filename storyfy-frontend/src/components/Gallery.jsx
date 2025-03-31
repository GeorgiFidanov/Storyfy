import { useState, useEffect } from 'react';
import axios from 'axios';
import { useFooter } from '../context/FooterContext';

function Gallery() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setFooterType } = useFooter();

  useEffect(() => {
    setFooterType('default');
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/images', {
        withCredentials: true
      });
      setImages(response.data.images);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (imageData, trackInfo) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = `${trackInfo.name}-${trackInfo.artist_name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="loading">Loading your gallery...</div>;

  return (
    <div className="gallery-container">
      <h2>Your Generated Images</h2>
      <div className="gallery-grid">
        {images.map((item, index) => (
          <div key={index} className="gallery-item">
            <img 
              src={`data:image/png;base64,${item.image_data}`} 
              alt={item.track_info.name} 
            />
            <div className="image-info">
              <h3>{item.track_info.name}</h3>
              <p>{item.track_info.artist_name}</p>
              <p className="timestamp">
                Generated on: {new Date(item.timestamp).toLocaleDateString()}
              </p>
              <button 
                onClick={() => downloadImage(item.image_data, item.track_info)}
                className="download-button"
              >
                Download Image
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gallery; 