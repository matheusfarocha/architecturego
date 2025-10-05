import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import './AuthPage.css';

function SignUpPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/app/home');
  };

  const handleGoogle = () => {
    navigate('/app/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create an account</h1>
          <p>Join LandMarks and collect your travels</p>
        </div>
        <button type="button" className="google-btn" onClick={handleGoogle}>
          <FcGoogle size={24} />
          Continue with Google
        </button>
        <div className="auth-divider">
          <span />
          <p>Or sign up with email</p>
          <span />
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Full name
            <input type="text" placeholder="Alex Traveler" required />
          </label>
          <label className="auth-label">
            Email
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label className="auth-label">
            Password
            <input type="password" placeholder="Create a password" required />
          </label>
          <button type="submit" className="primary-btn auth-submit">
            Create account
          </button>
        </form>
        <p className="auth-footer">
          Already have an account?
          <Link to="/signin"> Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;
