import { Link } from 'react-router-dom';
import { FiCamera, FiMapPin } from 'react-icons/fi';
import { TbBook2 } from 'react-icons/tb';
import useTypingEffect from '../hooks/useTypingEffect.js';
import './LandingPage.css';

function LandingPage() {
  const typedText = useTypingEffect('See New Sights', 95, 250);

  return (
    <div className="landing-page">
      <div className="landing-backdrop">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>
      <div className="landing-card gradient-card">
        <div className="landing-header">
          <span className="landing-tag">Discover your world</span>
          <h1>LandMarks</h1>
          <p className="landing-typed">
            <span>{typedText}</span>
            <span className={typedText ? 'cursor' : 'cursor hidden'}>|</span>
          </p>
          <p className="landing-copy">
            Embark on immersive journeys, capture iconic sights in real time, and curate your
            personal atlas of memories.
          </p>
        </div>
        <div className="landing-actions">
          <Link to="/signin" className="primary-btn">
            Get Started
          </Link>
          <Link to="/signup" className="ghost-btn">
            Create account
          </Link>
        </div>
        <div className="landing-highlights">
          <div className="highlight">
            <div className="highlight-icon">
              <FiCamera size={22} />
            </div>
            <p>Live camera adventures</p>
          </div>
          <div className="highlight">
            <div className="highlight-icon">
              <TbBook2 size={22} />
            </div>
            <p>Build your travel library</p>
          </div>
          <div className="highlight">
            <div className="highlight-icon">
              <FiMapPin size={22} />
            </div>
            <p>Navigate smarter routes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
