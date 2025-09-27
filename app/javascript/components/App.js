import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import EngineersList from './pages/EngineersList';

function App() {
  const [currentPage, setCurrentPage] = useState('engineers');
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock user data - in a real app, this would come from authentication
  useEffect(() => {
    setUser({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      image_url: null
    });
  }, []);

  // Handle navigation between pages
  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
  };

  // Handle global search
  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Global search:', query);
    // In a real app, you might want to navigate to a search results page
    // or update the current page's search filters
  };

  // Set up global navigation handler for navbar
  useEffect(() => {
    window.onNavigate = handleNavigate;
    return () => {
      window.onNavigate = null;
    };
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPlaceholder />;
      case 'engineers':
        return <EngineersList searchQuery={searchQuery} />;
      case 'opportunities':
        return <OpportunitiesPlaceholder />;
      case 'matching':
        return <MatchingPlaceholder />;
      case 'analytics':
        return <AnalyticsPlaceholder />;
      case 'settings':
        return <SettingsPlaceholder />;
      default:
        return <EngineersList searchQuery={searchQuery} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      user={user}
      onSearch={handleSearch}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

// Placeholder components for other pages
const DashboardPlaceholder = () => (
  <div className="page-placeholder">
    <div className="placeholder-content">
      <h2>🏠 Dashboard</h2>
      <p>Dashboard page coming soon...</p>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Available Engineers</h3>
          <div className="stat-number">15</div>
        </div>
        <div className="stat-card">
          <h3>Rolling Off</h3>
          <div className="stat-number">8</div>
        </div>
        <div className="stat-card">
          <h3>On Bench</h3>
          <div className="stat-number">3</div>
        </div>
        <div className="stat-card">
          <h3>Open Opportunities</h3>
          <div className="stat-number">12</div>
        </div>
      </div>
    </div>
    <style jsx>{`
      .page-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        color: #6b7280;
      }
      
      .placeholder-content h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #374151;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
        width: 100%;
        max-width: 800px;
      }
      
      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      
      .stat-card h3 {
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 0.5rem;
      }
      
      .stat-number {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1e293b;
      }
    `}</style>
  </div>
);

const OpportunitiesPlaceholder = () => (
  <div className="page-placeholder">
    <h2>💼 Opportunities</h2>
    <p>Opportunities page coming soon...</p>
    <style jsx>{`
      .page-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        color: #6b7280;
      }
      
      .page-placeholder h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #374151;
      }
    `}</style>
  </div>
);

const MatchingPlaceholder = () => (
  <div className="page-placeholder">
    <h2>⚡ Matching</h2>
    <p>AI-powered matching system coming soon...</p>
    <style jsx>{`
      .page-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        color: #6b7280;
      }
      
      .page-placeholder h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #374151;
      }
    `}</style>
  </div>
);

const AnalyticsPlaceholder = () => (
  <div className="page-placeholder">
    <h2>📊 Analytics</h2>
    <p>Analytics dashboard coming soon...</p>
    <style jsx>{`
      .page-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        color: #6b7280;
      }
      
      .page-placeholder h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #374151;
      }
    `}</style>
  </div>
);

const SettingsPlaceholder = () => (
  <div className="page-placeholder">
    <h2>⚙️ Settings</h2>
    <p>Settings page coming soon...</p>
    <style jsx>{`
      .page-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        color: #6b7280;
      }
      
      .page-placeholder h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #374151;
      }
    `}</style>
  </div>
);

export default App;
