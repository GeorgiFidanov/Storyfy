import React, { useState, useEffect } from 'react';
import './DynamicFooter.css';

const DynamicFooter = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide footer when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      // Always show footer at the bottom of the page
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 100;
      if (isAtBottom) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <footer className={`dynamic-footer ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="footer-content">
        <p>© 2024 Storyfy - Turn your music into art</p>
      </div>
    </footer>
  );
};

export default DynamicFooter; 