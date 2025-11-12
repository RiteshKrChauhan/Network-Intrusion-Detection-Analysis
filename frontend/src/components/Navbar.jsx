import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>NIDS Dashboard</h1>
      </div>
      
      <div className="navbar-user">
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
          <span className={`user-role ${isAdmin ? 'admin' : 'viewer'}`}>
            {isAdmin ? '👑 Admin' : '👁️ Viewer'}
          </span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
