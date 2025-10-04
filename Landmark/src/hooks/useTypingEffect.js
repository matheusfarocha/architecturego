import { useEffect, useRef, useState } from 'react';

export default function useTypingEffect(text = '', speed = 110, delay = 400) {
  const [typed, setTyped] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    setTyped('');
    if (!text) {
      return undefined;
    }

    const startTimeout = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setTyped((prev) => {
          if (prev.length >= text.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return prev;
          }
          return prev + text.charAt(prev.length);
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed, delay]);

  return typed;
}
