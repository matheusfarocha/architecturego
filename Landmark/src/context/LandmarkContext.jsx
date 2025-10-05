import React, { createContext, useContext, useState, useEffect } from "react";

const LandmarkContext = createContext();

export const LandmarkProvider = ({ children }) => {
  const [captures, setCaptures] = useState([]);
  const [summaries, setSummaries] = useState({});

  // --- Load data from localStorage on mount
  useEffect(() => {
    const savedCaptures = localStorage.getItem("captures");
    const savedSummaries = localStorage.getItem("summaries");

    if (savedCaptures) setCaptures(JSON.parse(savedCaptures));
    if (savedSummaries) setSummaries(JSON.parse(savedSummaries));
  }, []);

  // --- Persist captures
  useEffect(() => {
    localStorage.setItem("captures", JSON.stringify(captures));
  }, [captures]);

  // --- Persist summaries
  useEffect(() => {
    localStorage.setItem("summaries", JSON.stringify(summaries));
  }, [summaries]);

  // --- Add new capture
  const addCapture = (capture) => {
    setCaptures((prev) => [...prev, capture]);
  };

  // --- Delete a capture by ID
  const deleteCapture = (id) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  };

  // --- Add or update AI summary for a landmark
  const addSummary = (landmark, summary) => {
    setSummaries((prev) => ({
      ...prev,
      [landmark]: summary,
    }));
  };

  // --- Retrieve AI summary for a specific landmark
  const getSummary = (landmark) => summaries[landmark];

  // --- Delete AI summary for a landmark (optional helper)
  const deleteSummary = (landmark) => {
    setSummaries((prev) => {
      const updated = { ...prev };
      delete updated[landmark];
      return updated;
    });
  };

  return (
    <LandmarkContext.Provider
      value={{
        captures,
        addCapture,
        deleteCapture,
        summaries,
        addSummary,
        getSummary,
        deleteSummary,
      }}
    >
      {children}
    </LandmarkContext.Provider>
  );
};

// ✅ Custom hook for easier access
export const useLandmarks = () => useContext(LandmarkContext);
