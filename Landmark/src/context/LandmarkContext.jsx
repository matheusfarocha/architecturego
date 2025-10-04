import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const LandmarkContext = createContext(null);

export function LandmarkProvider({ children }) {
  const [captures, setCaptures] = useState([]);

  const addCapture = useCallback((capture) => {
    setCaptures((prev) => {
      const next = [capture, ...prev];
      return next.slice(0, 50);
    });
  }, []);

  const value = useMemo(() => ({ captures, addCapture }), [captures, addCapture]);

  return <LandmarkContext.Provider value={value}>{children}</LandmarkContext.Provider>;
}

export function useLandmarks() {
  const context = useContext(LandmarkContext);
  if (!context) {
    throw new Error('useLandmarks must be used within a LandmarkProvider');
  }
  return context;
}
