import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner } from 'react-bootstrap';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import EngineersList from './pages/EngineersList';
import ClientsList from './pages/ClientsList';
import OpportunitiesList from './pages/OpportunitiesList';
import OpportunityDetail from './pages/OpportunityDetail';
import MatchingPage from './pages/MatchingPage';
import NotificationsList from './pages/NotificationsList';

const EngineerDetail = React.lazy(() => import('./pages/EngineerDetail'));

function App() {
  console.log('App component rendered');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [opportunityId, setOpportunityId] = useState(null);
  const [clientFilter, setClientFilter] = useState(null);
  const [engineerId, setEngineerId] = useState(null);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    fetch('/api/current_user')
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error checking auth status:', error);
        setIsLoading(false);
      });
  }, []);

  // Handle navigation between pages
  const handleNavigate = (pageId, params = {}) => {
    setCurrentPage(pageId);
    if (params.opportunityId) {
      setOpportunityId(params.opportunityId);
    } else {
      setOpportunityId(null);
    }
    if (params.clientId) {
      setClientFilter(params.clientId);
    } else {
      setClientFilter(null);
    }
    if (params.engineerId) {
      setEngineerId(params.engineerId);
    } else {
      setEngineerId(null);
    }
  };  // Handle global search
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
        return <Dashboard onNavigate={handleNavigate} />;
      case 'engineers':
        return <EngineersList searchQuery={searchQuery} onNavigate={handleNavigate} />;
      case 'engineer-detail':
        return <EngineerDetail engineerId={engineerId} onNavigate={handleNavigate} />;
      case 'clients':
        return <ClientsList searchQuery={searchQuery} onNavigate={handleNavigate} />;
      case 'opportunities':
        return <OpportunitiesList searchQuery={searchQuery} onNavigate={handleNavigate} clientFilter={clientFilter} />;
      case 'opportunity-detail':
        return <OpportunityDetail opportunityId={opportunityId} onNavigate={handleNavigate} />;
      case 'matching':
        return <MatchingPage searchQuery={searchQuery} onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsList searchQuery={searchQuery} onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google_oauth2';
  };

  const handleLogout = () => {
    fetch('/logout', {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      }
    })
      .then(() => {
        setUser(null);
        window.location.href = '/';
      })
      .catch(error => {
        console.error('Logout error:', error);
      });
  };

  // Loading state
  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading Match Mind...</p>
        </div>
      </Container>
    );
  }

  // Authentication required
  if (!user) {
  return (
      <Container fluid className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center p-5 bg-white rounded shadow-sm" style={{ maxWidth: '400px' }}>
          <div className="mb-4">
            <h1 className="h3 mb-3">Welcome to Match Mind</h1>
            <p className="text-muted">
              Connect engineers with opportunities using AI-powered matching
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-100"
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              <>
                <span className="me-2">🚀</span>
                Sign in with Google
              </>
            )}
          </Button>

          <p className="text-muted mt-3 small">
            Secure authentication powered by Google OAuth
          </p>
        </div>
      </Container>
    );
  }

  // Main application
  return (
    <Layout
      currentPage={currentPage}
      user={user}
      onSearch={handleSearch}
      onLogout={handleLogout}
    >
      {renderCurrentPage()}
    </Layout>
  );
}



export default App;
