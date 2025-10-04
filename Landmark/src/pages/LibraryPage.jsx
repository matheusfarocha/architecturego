import { FiCamera } from 'react-icons/fi';
import { TbMapPin } from 'react-icons/tb';
import { useLandmarks } from '../context/LandmarkContext.jsx';
import './LibraryPage.css';

function LibraryPage() {
  const { captures } = useLandmarks();

  return (
    <section className="library-page">
      <div className="library-header">
        <div>
          <h2>Your Landmark Library</h2>
          <p>
            {captures.length > 0
              ? `You have saved ${captures.length} memorable ${captures.length === 1 ? 'landmark' : 'landmarks'}.`
              : 'Every capture tells a story—start collecting yours.'}
          </p>
        </div>
      </div>

      {captures.length === 0 ? (
        <div className="library-empty gradient-card">
          <FiCamera size={36} />
          <h3>No captures yet</h3>
          <p>Head to the camera tab to snap your first moment.</p>
        </div>
      ) : (
        <div className="library-grid">
          {captures.map((capture) => {
            const displayName = capture.name || 'Snapshot';
            const capturedAt = new Date(capture.timestamp);
            const hasLabels = Array.isArray(capture.labels) && capture.labels.length > 0;
            const hasLocation = Boolean(capture.location?.latitude) && Boolean(capture.location?.longitude);
            const hasConfidence = typeof capture.score === 'number';

            return (
              <article key={capture.id} className="library-card surface-card">
                <div className="library-image">
                  <img src={capture.image} alt={displayName} />
                  {hasConfidence && (
                    <span className="library-badge">{Math.round(capture.score * 100)}% match</span>
                  )}
                </div>
                <div className="library-content">
                  <h3>{displayName}</h3>
                  <p className="library-time">
                    {capturedAt.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {hasLocation && (
                    <p className="library-location">
                      <TbMapPin />
                      Lat {capture.location.latitude.toFixed(3)} · Lon {capture.location.longitude.toFixed(3)}
                    </p>
                  )}
                  {hasLabels ? (
                    <div className="library-tags">
                      {capture.labels.slice(0, 4).map((label) => (
                        <span key={`${capture.id}-${label.description}`}>{label.description}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="library-note">Saved from the live camera.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default LibraryPage;
