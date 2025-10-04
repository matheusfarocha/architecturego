import { Link, useNavigate } from 'react-router-dom';
import './AuthPage.css';

function SignInPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/app/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to start exploring new landmarks</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label className="auth-label">
            Password
            <input type="password" placeholder="••••••••" required />
          </label>
          <button type="submit" className="primary-btn auth-submit">
            Sign In
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account?
          <Link to="/signup"> Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default SignInPage;
