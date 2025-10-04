import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiCamera } from 'react-icons/fi';
import { TbBook2 } from 'react-icons/tb';
import { FaRegCompass } from 'react-icons/fa';
import placeholderProfile from '../assets/profile-placeholder.svg';
import './AppLayout.css';

const navItems = [
  { to: '/app/home', label: 'Camera', icon: <FiCamera size={22} /> },
  { to: '/app/library', label: 'Library', icon: <TbBook2 size={22} /> },
  {
    to: '/app/profile',
    label: 'Profile',
    icon: <img src={placeholderProfile} alt="Profile" className="nav-avatar" />,
  },
  { to: '/app/map', label: 'Map', icon: <FaRegCompass size={22} /> },
];

function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet context={{ pathname: location.pathname }} />
      </main>
      <nav className="bottom-nav gradient-card">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
          >
            <div className="nav-icon">{item.icon}</div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppLayout;
