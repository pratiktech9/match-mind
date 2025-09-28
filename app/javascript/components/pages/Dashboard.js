import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Table,
  Spinner, Alert, ProgressBar
} from 'react-bootstrap';

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    available: 0,
    rolling_off: 0,
    on_bench: 0,
    open_opportunities: 0
  });
  const [availabilityCalendar, setAvailabilityCalendar] = useState([]);
  const [urgentMatches, setUrgentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats, calendar data, and urgent matches
      const [statsRes, calendarRes, urgentRes] = await Promise.all([
        fetch('/api/v1/dashboard/stats'),
        fetch('/api/v1/dashboard/availability-calendar'),
        fetch('/api/v1/dashboard/urgent-matches')
      ]);

      // Check individual responses
      let statsData = { data: { available: 0, rolling_off: 0, on_bench: 0, open_opportunities: 0 } };
      let calendarData = { data: [] };
      let urgentData = { data: [] };

      if (statsRes.ok) {
        statsData = await statsRes.json();
      } else {
        console.warn('Failed to fetch stats data:', statsRes.status);
      }

      if (calendarRes.ok) {
        calendarData = await calendarRes.json();
      } else {
        console.warn('Failed to fetch calendar data:', calendarRes.status);
      }

      if (urgentRes.ok) {
        urgentData = await urgentRes.json();
      } else {
        console.warn('Failed to fetch urgent matches data:', urgentRes.status);
      }

      setStats(statsData.data || {});
      setAvailabilityCalendar(calendarData.data || []);
      setUrgentMatches(urgentData.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  const getStatColor = (type) => {
    const colors = {
      available: 'success',
      rolling_off: 'warning',
      on_bench: 'info',
      open_opportunities: 'primary'
    };
    return colors[type] || 'secondary';
  };

  const getStatIcon = (type) => {
    const icons = {
      available: '✅',
      rolling_off: '⏰',
      on_bench: '🔄',
      open_opportunities: '💼'
    };
    return icons[type] || '📊';
  };

  const formatStatLabel = (type) => {
    const labels = {
      available: 'Available',
      rolling_off: 'Rolling Off',
      on_bench: 'On Bench',
      open_opportunities: 'Open Opps'
    };
    return labels[type] || type;
  };

  const getUrgencyColor = (daysOpen) => {
    if (daysOpen <= 3) return 'success';
    if (daysOpen <= 7) return 'warning';
    return 'danger';
  };

  const getMatchQualityColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'warning';
    return 'danger';
  };

  const handleViewOpportunity = (opportunityId) => {
    if (onNavigate) {
      onNavigate('opportunity-detail', { opportunityId });
    }
  };

  if (loading) {
    return (
      <Container fluid>
        <Row className="justify-content-center py-5">
          <Col xs="auto">
            <div className="text-center">
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="text-muted">Loading dashboard...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <Row>
          <Col>
            <Alert variant="danger" className="mt-4">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
              <Button variant="outline-danger" onClick={fetchDashboardData}>
                Try Again
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">🏠 Dashboard</h2>
              <p className="text-muted mb-0">Welcome back! Here's your overview</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => onNavigate('matching')}>
              🔍 Smart Match
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mb-4">
            <h5 className="mb-3">📊 Quick Stats</h5>
            <Row>
              {Object.entries(stats).map(([key, value]) => (
                <Col key={key} lg={3} md={6} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>
                        {getStatIcon(key)}
                      </div>
                      <h3 className={`text-${getStatColor(key)} mb-1`}>
                        {value}
                      </h3>
                      <p className="text-muted small mb-0">
                        {formatStatLabel(key)}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* Availability Calendar */}
          <div className="mb-4">
            <h5 className="mb-3">📅 Availability Calendar</h5>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {availabilityCalendar.length > 0 ? (
                  <Row className="text-center">
                    {availabilityCalendar.map((day, index) => (
                      <Col key={index}>
                        <div className="mb-2">
                          <div className="small text-muted fw-bold">{day.day}</div>
                          <div className="small text-muted">{day.date}</div>
                        </div>
                        <div
                          className={`mx-auto rounded ${
                            day.count > 0 ? 'bg-primary text-white' : 'bg-light text-muted'
                          }`}
                          style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {day.count || '−'}
                        </div>
                        <div className="small text-muted mt-1">
                          {day.count > 0 ? `${day.count} avail` : 'None'}
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="text-center py-3">
                    <div className="text-muted">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>📅</div>
                      <p className="small mb-0">Calendar data loading...</p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Urgent Matches Needed */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">🔥 Urgent Matches Needed</h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onNavigate('opportunities')}
              >
                View All Opportunities
              </Button>
            </div>
            {urgentMatches.length > 0 ? (
              <Row>
                {urgentMatches.map((match, index) => (
                  <Col key={match.id} lg={4} md={6} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{match.client}</h6>
                            <p className="text-muted small mb-0">{match.role}</p>
                          </div>
                          <Badge bg={getUrgencyColor(match.days_open)}>
                            {match.days_open} days
                          </Badge>
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted">Match Quality</span>
                            <span className={`small fw-bold text-${getMatchQualityColor(match.match_percentage)}`}>
                              {match.match_percentage}%
                            </span>
                          </div>
                          <ProgressBar
                            variant={getMatchQualityColor(match.match_percentage)}
                            now={match.match_percentage}
                            style={{ height: '6px' }}
                          />
                        </div>

                        <div className="mb-3">
                          <div className="small text-muted mb-1">Required Skills</div>
                          <div className="d-flex flex-wrap gap-1">
                            {match.skills && match.skills.length > 0 ? (
                              <>
                                {match.skills.slice(0, 2).map((skill, idx) => (
                                  <Badge key={idx} bg="light" text="dark" className="small">
                                    {skill}
                                  </Badge>
                                ))}
                                {match.skills.length > 2 && (
                                  <Badge bg="secondary" className="small">
                                    +{match.skills.length - 2}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge bg="light" text="muted" className="small">
                                No skills specified
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">{match.budget}</small>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleViewOpportunity(match.id)}
                          >
                            View Match
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <div className="text-muted">
                    <div className="mb-2" style={{ fontSize: '3rem' }}>📋</div>
                    <h6>No Urgent Matches Found</h6>
                    <p className="small mb-3">All opportunities are either new or already have matches.</p>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onNavigate('opportunities')}
                    >
                      View All Opportunities
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-4">
            <h5 className="mb-3">⚡ Quick Actions</h5>
            <Row>
              <Col md={6} lg={4} className="mb-3">
                <Card
                  className="h-100 border-0 shadow-sm text-center cursor-pointer"
                  onClick={() => onNavigate('engineers')}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="py-4">
                    <div className="mb-2" style={{ fontSize: '2rem' }}>👥</div>
                    <h6>Browse Engineers</h6>
                    <p className="text-muted small mb-0">View all available engineers</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={4} className="mb-3">
                <Card
                  className="h-100 border-0 shadow-sm text-center cursor-pointer"
                  onClick={() => onNavigate('opportunities')}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="py-4">
                    <div className="mb-2" style={{ fontSize: '2rem' }}>💼</div>
                    <h6>View Opportunities</h6>
                    <p className="text-muted small mb-0">Browse open positions</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={4} className="mb-3">
                <Card
                  className="h-100 border-0 shadow-sm text-center cursor-pointer"
                  onClick={() => onNavigate('matching')}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="py-4">
                    <div className="mb-2" style={{ fontSize: '2rem' }}>⚡</div>
                    <h6>Smart Matching</h6>
                    <p className="text-muted small mb-0">AI-powered matching</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
