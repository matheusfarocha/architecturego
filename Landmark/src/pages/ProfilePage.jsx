import './ProfilePage.css';
import { useState } from 'react';
import placeholderProfile from '../assets/profile-placeholder.svg';

const XP_TOTAL = 100;
const CURRENT_XP = 72;
const LEVEL = 3;

function ProfilePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

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
            <div className="profile-avatar">
              <img src={placeholderProfile} alt="User avatar" />
            </div>
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
            <div className="progress-fill" style={{ width: `${(CURRENT_XP / XP_TOTAL) * 100}%` }} />
          </div>
          <p className="progress-note">
            Explore more landmarks to level up and unlock exclusive travel badges.
          </p>
        </div>

        <div className="profile-stats">
          <div className="stat-card surface-card" onClick={() => openModal('landmarks')}>
            <strong>28</strong>
            <span>Landmarks logged</span>
          </div>
          <div className="stat-card surface-card" onClick={() => openModal('countries')}>
            <strong>12</strong>
            <span>Countries visited</span>
          </div>
          <div className="stat-card surface-card" onClick={() => openModal('badges')}>
            <strong>7</strong>
            <span>Badges earned</span>
          </div>
        </div>

        {modalOpen && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-content onClick={(e) => e.stopPropagation()}">
              <button className="modal-close" onClick={closeModal}>x</button>
              {modalType === 'landmarks' && <p>Landmark details...</p>}
              {modalType === 'countries' && <p>Countries details...</p>}
              {modalType === 'badges' && <p>Badges details...</p>}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default ProfilePage;
