import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiInfo, FiSave } from 'react-icons/fi';
import { useLandmarks } from '../context/LandmarkContext.jsx';
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
            width: { ideal: 1280 },
            height: { ideal: 720 },
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

  const handleCapture = () => {
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
    const timestamp = new Date().toISOString();
    const capture = {
      id: `${Date.now()}`,
      name: `Snapshot ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp,
      image: dataUrl,
    };

    addCapture(capture);
    setLastSnapshot(capture);
    setStatus('Snapshot saved to your library.');
    setTimeout(() => {
      setIsSaving(false);
    }, 400);
  };

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
              <p className="snapshot-note">Find every saved moment in your library tab.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HomePage;
