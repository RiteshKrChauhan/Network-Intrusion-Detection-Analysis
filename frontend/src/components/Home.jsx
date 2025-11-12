import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1 className="home-title">Network Intrusion Detection System</h1>
          <p className="home-subtitle">
            ML Model Evaluation Dashboard for CICIDS-2017 Dataset
          </p>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Advanced Analytics</h3>
            <p>Track and compare ML model performance metrics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-time Monitoring</h3>
            <p>View accuracy, precision, recall, and F1 scores</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Access</h3>
            <p>Role-based access control for team collaboration</p>
          </div>
        </div>

        <div className="home-actions">
          <button onClick={() => navigate('/login')} className="btn-primary-large">
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="btn-secondary-large">
            Create Account
          </button>
        </div>

        <div className="home-info">
          <p>Built with React, Node.js, Express, and PostgreSQL</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
