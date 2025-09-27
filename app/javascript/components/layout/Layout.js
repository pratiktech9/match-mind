import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import Navbar from './Navbar';
import Header from './Header';

const Layout = ({ children, currentPage, title, user, onSearch, onLogout }) => {
  const [currentPageState, setCurrentPageState] = useState(currentPage || 'dashboard');
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);

  const handleNavigate = (pageId) => {
    setCurrentPageState(pageId);
    // In a real app with React Router, you would navigate here
    // For now, we'll just update the state and let parent handle the navigation
    if (window.onNavigate) {
      window.onNavigate(pageId);
    }
  };

  const handleNavbarToggle = (collapsed) => {
    setIsNavbarCollapsed(collapsed);
  };

  const getPageTitle = (page) => {
    const titles = {
      dashboard: 'Dashboard',
      engineers: 'Engineers',
      clients: 'Clients',
      opportunities: 'Opportunities',
      matching: 'Matching',
      analytics: 'Analytics',
      settings: 'Settings'
    };
    return titles[page] || title || 'Match Mind';
  };

  return (
    <div className={`layout d-flex ${isNavbarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ height: '100vh', overflow: 'hidden' }}>
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPageState}
        onToggle={handleNavbarToggle}
      />

      <div className="layout-main flex-fill d-flex flex-column"
           style={{
             marginLeft: isNavbarCollapsed ? '70px' : '280px',
             transition: 'margin-left 0.3s ease',
             minWidth: 0
           }}>
        <Header
          title={getPageTitle(currentPageState)}
          user={user}
          onSearch={onSearch}
          onLogout={onLogout}
        />

        <main className="layout-content flex-fill overflow-auto bg-light">
          <Container fluid className="p-4" style={{ minHeight: '100%' }}>
            {children}
          </Container>
        </main>
      </div>

      <style>{`
        /* Mobile responsive */
        @media (max-width: 768px) {
          .layout-main {
            margin-left: 0 !important;
          }
        }

        /* Tablet responsive */
        @media (max-width: 1024px) {
          .layout-main {
            margin-left: 70px !important;
          }
        }

        /* Responsive adjustments when sidebar is collapsed */
        .layout.sidebar-collapsed .layout-main {
          margin-left: 70px !important;
        }

        /* Custom scrollbar */
        .layout-content::-webkit-scrollbar {
          width: 8px;
        }

        .layout-content::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .layout-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .layout-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Layout;
