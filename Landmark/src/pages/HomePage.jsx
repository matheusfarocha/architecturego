import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiInfo, FiSave } from 'react-icons/fi';
import { TbMapPin } from 'react-icons/tb';
import { useLandmarks } from '../context/LandmarkContext.jsx';
import { detectLandmarks } from '../services/vision.js';
import { describeLandmark } from '../services/gemini.js';
import './HomePage.css';

function HomePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { addCapture } = useLandmarks();

  const [status, setStatus] = useState('Allow camera access to start exploring.');
  const [permission, setPermission] = useState('prompt');
  const [videoReady, setVideoReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState(null);

  useEffect(() => {
    const requestStream = async () => {
      try {
        setStatus('Initializing camera…');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setPermission('granted');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Unable to access camera', error);
        setPermission('denied');
        setStatus('Camera permission denied.');
      }
    };

    requestStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const handleLoaded = () => {
      video.play().catch(() => undefined);
      setVideoReady(true);
      setStatus('Camera is live. Capture moments as you explore.');
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    if (!videoReady) {
      setStatus('Hold on—camera feed is still starting.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setIsSaving(true);
    setStatus('Analyzing snapshot for landmarks…');

    const timestamp = new Date().toISOString();
    const defaultName = `Snapshot ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let annotations = [];
    let analysisError = null;

    try {
      annotations = await detectLandmarks(dataUrl);
    } catch (error) {
      console.error('Landmark detection failed', error);
      analysisError = error instanceof Error ? error.message : 'Unable to analyze snapshot.';
    }

    const primary = annotations[0] || null;
    let description = null;
    let descriptionError = null;

    if (primary?.description && !analysisError) {
      try {
        setStatus(`Landmark detected: ${primary.description}. Gathering story…`);
        description = await describeLandmark(primary.description);
      } catch (error) {
        console.error('Gemini description failed', error);
        descriptionError = error instanceof Error ? error.message : 'Unable to describe this landmark right now.';
      }
    }

    const capture = {
      id: `${Date.now()}`,
      name: primary?.description || defaultName,
      timestamp,
      image: dataUrl,
      labels: annotations.map((annotation) => ({
        description: annotation.description,
        score: annotation.score,
      })),
      location: primary?.location || null,
      score: primary?.score || null,
      analysisError,
      description,
      descriptionError,
    };

    addCapture(capture);
    setLastSnapshot(capture);

    if (description) {
      setStatus(`Landmark detected: ${primary.description}. Description ready.`);
    } else if (descriptionError && primary?.description) {
      setStatus('Snapshot saved—landmark detected but story unavailable.');
    } else if (primary?.description) {
      setStatus(`Landmark detected: ${primary.description}`);
    } else if (analysisError) {
      setStatus('Snapshot saved—landmark insight unavailable right now.');
    } else {
      setStatus('Snapshot saved—no landmarks detected.');
    }

    setIsSaving(false);
  };

  const snapshotHasLabels = Array.isArray(lastSnapshot?.labels) && lastSnapshot.labels.length > 0;
  const snapshotHasLocation = Boolean(lastSnapshot?.location?.latitude) && Boolean(lastSnapshot?.location?.longitude);
  const snapshotHasError = Boolean(lastSnapshot?.analysisError);
  const snapshotHasDescription = Boolean(lastSnapshot?.description);
  const snapshotDescriptionError = Boolean(lastSnapshot?.descriptionError);

  return (
    <section className="home-page">
      <div className="camera-panel surface-card">
        <div className="camera-header">
          <div className="camera-title">
            <FiCamera size={24} />
            <div>
              <h2>Live Camera</h2>
              <p>{status}</p>
            </div>
          </div>
          <button
            type="button"
            className="primary-btn compact"
            onClick={handleCapture}
            disabled={permission !== 'granted' || !videoReady || isSaving}
          >
            <FiSave />
            Capture snapshot
          </button>
        </div>

        <div className="camera-body">
          {permission === 'denied' && (
            <div className="camera-overlay warning">
              <FiInfo size={24} />
              <p>
                Camera access is blocked. Allow camera permissions in your browser settings and refresh
                the page.
              </p>
            </div>
          )}

          <div className="camera-frame gradient-card">
            <video ref={videoRef} playsInline autoPlay muted />
            <canvas ref={canvasRef} className="hidden-canvas" />
          </div>
        </div>
      </div>

      {lastSnapshot && (
        <div className="snapshot-summary gradient-card">
          <h3>Latest snapshot</h3>
          <div className="snapshot-content">
            <div className="snapshot-image">
              <img src={lastSnapshot.image} alt={lastSnapshot.name} />
            </div>
            <div className="snapshot-details">
              <h4>{lastSnapshot.name}</h4>
              <p className="snapshot-time">
                Captured {new Date(lastSnapshot.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {snapshotHasLocation && (
                <p className="snapshot-location">
                  <TbMapPin size={16} />
                  Lat {lastSnapshot.location.latitude.toFixed(3)} · Lon {lastSnapshot.location.longitude.toFixed(3)}
                </p>
              )}
              {snapshotHasLabels ? (
                <div className="snapshot-tags">
                  {lastSnapshot.labels.slice(0, 4).map((label) => (
                    <span key={`${lastSnapshot.id}-${label.description}`}>{label.description}</span>
                  ))}
                </div>
              ) : (
                <p className="snapshot-note">No landmarks detected this time.</p>
              )}
              {snapshotHasDescription && (
                <p className="snapshot-description">{lastSnapshot.description}</p>
              )}
              {snapshotHasError && (
                <p className="snapshot-warning">Vision service unavailable: {lastSnapshot.analysisError}</p>
              )}
              {snapshotDescriptionError && (
                <p className="snapshot-warning">Gemini service unavailable: {lastSnapshot.descriptionError}</p>
              )}
              <p className="snapshot-note snapshot-library-note">Find every saved moment in your library tab.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HomePage;
