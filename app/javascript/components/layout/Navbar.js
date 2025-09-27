import React, { useState } from 'react';
import {
  Nav,
  Button,
  ListGroup
} from 'react-bootstrap';

const Navbar = ({ onNavigate, currentPage, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', active: false },
    { id: 'engineers', icon: '👥', label: 'Engineers', active: currentPage === 'engineers' },
    { id: 'clients', icon: '🏢', label: 'Clients', active: currentPage === 'clients' },
    { id: 'opportunities', icon: '💼', label: 'Opportunities', active: false },
    { id: 'matching', icon: '⚡', label: 'Matching', active: false },
    { id: 'analytics', icon: '📊', label: 'Analytics', active: false },
    { id: 'settings', icon: '⚙️', label: 'Settings', active: false },
  ];

  const savedSearches = [
    { id: 1, name: 'React US Available' },
    { id: 2, name: 'Python FinTech' },
    { id: 3, name: 'Urgent DevOps' },
  ];

  const favoriteMatches = [
    { id: 1, engineer: 'Sarah Chen', client: 'TechCorp' },
    { id: 2, engineer: 'Mike Ross', client: 'FinBank' },
  ];

  return (
    <div className={`navbar-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            {!isCollapsed && <span className="logo-text">Matching System</span>}
            {isCollapsed && <span className="logo-icon">💼</span>}
          </div>
          <Button
            variant="link"
            className="collapse-toggle p-0"
            onClick={toggleCollapsed}
          >
            {isCollapsed ? '→' : '←'}
          </Button>
        </div>

        <div className="sidebar-content">
          {/* Main Navigation */}
          <Nav className="flex-column nav-menu">
            {menuItems.map((item) => (
              <Nav.Item key={item.id} className={`nav-item ${item.active ? 'active' : ''}`}>
                <Nav.Link
                  className="nav-link"
                  onClick={() => onNavigate(item.id)}
                  eventKey={item.id}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {!isCollapsed && (
            <>
              {/* Saved Searches */}
              <div className="nav-section">
                <div className="nav-section-header">
                  <span className="section-icon">🔍</span>
                  <span className="section-title">Saved Searches</span>
                </div>
                <ListGroup variant="flush" className="nav-subsection">
                  {savedSearches.map((search) => (
                    <ListGroup.Item
                      key={search.id}
                      action
                      className="nav-subitem"
                    >
                      <span className="bullet">·</span>
                      {search.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>

              {/* Favorite Matches */}
              <div className="nav-section">
                <div className="nav-section-header">
                  <span className="section-icon">⭐</span>
                  <span className="section-title">Favorite Matches</span>
                </div>
                <ListGroup variant="flush" className="nav-subsection">
                  {favoriteMatches.map((match) => (
                    <ListGroup.Item
                      key={match.id}
                      action
                      className="nav-subitem"
                    >
                      <span className="bullet">·</span>
                      {match.engineer} → {match.client}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </>
          )}
        </div>
      </nav>

      <style>{`
        .navbar-container {
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          transition: width 0.3s ease;
        }

        .sidebar {
          height: 100%;
          width: 280px;
          background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
          color: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #475569;
          transition: width 0.3s ease;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar.collapsed {
          width: 70px;
        }

        .sidebar-header {
          padding: 1.25rem;
          border-bottom: 1px solid #475569;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 80px;
        }

        .sidebar.collapsed .sidebar-header {
          padding: 1.25rem 0.75rem;
          justify-content: center;
          position: relative;
        }

        .logo {
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
          white-space: nowrap;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .collapse-toggle {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.2s;
          flex-shrink: 0;
        }

        .sidebar.collapsed .collapse-toggle {
          position: absolute;
          top: 50%;
          right: 0.5rem;
          transform: translateY(-50%);
        }

        .collapse-toggle:hover {
          color: white;
          background-color: #475569;
        }

        .sidebar-content {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .nav-menu {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-item {
          margin: 0.25rem 0;
        }

        .nav-item.active .nav-link {
          background-color: #3b82f6;
          color: white;
        }

        .nav-item.active .nav-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #60a5fa;
        }

        .nav-link {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 0.875rem 1.25rem;
          background: none;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          position: relative;
          text-align: left;
        }

        .nav-link:hover {
          background-color: #475569;
          color: white;
        }

        .nav-icon {
          font-size: 1.25rem;
          margin-right: 0.875rem;
          width: 1.5rem;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar.collapsed .nav-label {
          display: none;
        }

        .sidebar.collapsed .nav-icon {
          margin-right: 0;
        }

        .nav-section {
          margin: 1.5rem 0 0 0;
          padding-top: 1rem;
          border-top: 1px solid #475569;
        }

        .nav-section-header {
          display: flex;
          align-items: center;
          padding: 0.5rem 1.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .section-icon {
          margin-right: 0.75rem;
          font-size: 1rem;
        }

        .section-title {
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .nav-subsection {
          list-style: none;
          margin: 0.5rem 0 0 0;
          padding: 0;
        }

        .nav-subitem {
          margin: 0.125rem 0;
        }

        .nav-sublink {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 0.625rem 1.25rem 0.625rem 3rem;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          text-align: left;
        }

        .nav-sublink:hover {
          background-color: #475569;
          color: #cbd5e1;
        }

        .bullet {
          margin-right: 0.75rem;
          font-weight: bold;
        }

        /* Scrollbar styling */
        .sidebar-content::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-content::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        .sidebar-content::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            position: absolute;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .sidebar.collapsed {
            width: 100%;
            transform: translateX(-100%);
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Navbar;
