import { createContext, useContext, useState } from 'react';

const FooterContext = createContext();

export function FooterProvider({ children }) {
  const [footerType, setFooterType] = useState('default');
  const [failedPlaylists, setFailedPlaylists] = useState([]);

  return (
    <FooterContext.Provider value={{ footerType, setFooterType, failedPlaylists, setFailedPlaylists }}>
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  return useContext(FooterContext);
} 