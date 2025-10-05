import './ProfilePage.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLandmarks } from '../context/LandmarkContext.jsx';

function ProfilePage() {
  const { captures } = useLandmarks();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

  const XP_PER_CAPTURE = 50;
  const XP_TOTAL = 100;

  // Total XP accumulated
  const totalXP = captures.length * XP_PER_CAPTURE;

  // Level (starts at 1, increases every 100 XP)
  const LEVEL = Math.floor(totalXP / XP_TOTAL) + 1;

  // XP currently in this level
  const CURRENT_XP = totalXP % XP_TOTAL;

  // Progress percentage
  const progressPercent =
    totalXP === 0
      ? 0
      : Math.min(((totalXP % XP_TOTAL) / XP_TOTAL) * 100, 100);

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

  return (
    <section className="profile-page">
      <div className="profile-card gradient-card">
        <div className="profile-hero">
          <div className="profile-avatar-container">

            <span className="profile-level">Level {LEVEL}</span>
          </div>
          <div className="profile-basics">
            <h2>Alex Traveler</h2>
            <p className="profile-role">Globetrotter · Landmark Enthusiast</p>
          </div>
        </div>

        <div className="profile-progress">
          <div className="progress-header">
            <span>Experience Points</span>
            <span>
              {CURRENT_XP}/{XP_TOTAL}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="progress-note">
            Explore more landmarks to level up and unlock exclusive travel
            badges.
          </p>
        </div>

        <div className="profile-stats">
          <div className="stat-card surface-card">
            <Link
              to="/app/library"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <strong>{captures.length}</strong>
              <span>Landmarks logged</span>
            </Link>
          </div>

          <div
            className="stat-card surface-card"

          >
            <strong>{Math.floor(LEVEL / 2)}</strong>
            <span>Badges earned</span>
          </div>

        </div>

        {modalOpen && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
              {modalType === 'landmarks' && <p>Landmark details...</p>}
              {modalType === 'countries' && <p>Countries details...</p>}

            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfilePage;
