import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Badge, Spinner, Alert
} from 'react-bootstrap';

const EngineerDetail = ({ engineerId, onNavigate }) => {
  const [engineer, setEngineer] = useState(null);
  const [matchingOpportunities, setMatchingOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (engineerId) {
      fetchEngineerDetails();
      fetchMatchingOpportunities();
    }
  }, [engineerId]);

  const fetchEngineerDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/engineers/${engineerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEngineer(data.data);
    } catch (err) {
      console.error('Error fetching engineer details:', err);
      setError('Failed to load engineer details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchingOpportunities = async () => {
    setMatchesLoading(true);

    try {
      const response = await fetch(`/api/engineers/${engineerId}/matches`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatchingOpportunities(data.matches || []);
    } catch (err) {
      console.error('Error fetching matching opportunities:', err);
      // Don't set error for matches, just log it
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleBackToList = () => {
    onNavigate('engineers');
  };

  const handleViewOpportunity = (opportunityId) => {
    onNavigate('opportunity-detail', { opportunityId });
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      available: 'success',
      rolling_off_soon: 'warning',
      on_bench: 'info',
      on_project: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      available: '🟢',
      rolling_off_soon: '🟡',
      on_bench: '🔵',
      on_project: '🟠'
    };
    return icons[status] || '⚪';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'danger';
  };

  const getMatchScoreEmoji = (score) => {
    if (score >= 90) return '🥇';
    if (score >= 85) return '🥈';
    return '🥉';
  };

  const getBudgetCompatibility = (targetRate, budget) => {
    if (!targetRate || !budget) return { icon: '⚠️', text: 'Unknown budget' };

    // targetRate is hourly, budget might be annual or hourly
    const hourlyRate = parseInt(targetRate);
    const annualBudget = budget > 1000 ? budget : budget * 1000; // Assume if < 1000 it's in thousands
    const annualRate = hourlyRate * 40 * 52; // Assuming 40 hours/week, 52 weeks/year
    
    if (annualRate <= annualBudget) return { icon: '✅', text: 'Within budget' };
    if (annualRate <= annualBudget * 1.1) return { icon: '⚠️', text: 'Slightly above budget' };
    return { icon: '❌', text: 'Above budget' };
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
              <p className="text-muted">Loading engineer details...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error || !engineer) {
    return (
      <Container fluid>
        <Row>
          <Col>
            <Alert variant="danger" className="mt-4">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error || 'Engineer not found'}</p>
              <Button variant="outline-danger" onClick={handleBackToList}>
                Back to Engineers
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
          {/* Header Section */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom">
              <Row className="align-items-center">
                <Col>
                  <div className="d-flex align-items-center mb-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleBackToList}
                      className="me-3"
                    >
                      ← Back
                    </Button>
                    <div>
                      <h3 className="mb-1">
                        👤 {engineer.name}
                      </h3>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg={getStatusBadgeVariant(engineer.status)}>
                          {getStatusIcon(engineer.status)} {engineer.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm">
                      Match
                    </Button>
                    <Button variant="outline-warning" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      History
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body>
              {/* Basic Information */}
              <div className="mb-4">
                <h5 className="mb-3">📍 Basic Information</h5>
                <Card className="bg-light border">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <p className="mb-2">
                          <strong>{engineer.name}</strong> · {engineer.email}
                          {engineer.phone && <span> · {engineer.phone}</span>}
                        </p>
                        <p className="mb-2">
                          <strong>Location:</strong> {engineer.country} · <strong>Work Type:</strong> Remote · Full-time
                        </p>
                        <p className="mb-0">
                          <strong>Status:</strong> {getStatusIcon(engineer.status)} {engineer.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {engineer.expected_end_date && (
                            <span> (Available from {new Date(engineer.expected_end_date).toLocaleDateString()})</span>
                          )}
                          {engineer.status === 'available' && !engineer.expected_end_date && (
                            <span> (Available Now)</span>
                          )}
                        </p>
                      </Col>
                      <Col md={4}>
                        <div className="text-end">
                          <div className="mb-2">
                            <small className="text-muted">Member since:</small>
                            <div>{new Date(engineer.created_at).toLocaleDateString()}</div>
                          </div>
                          {engineer.utilization && (
                            <div className="mb-2">
                              <small className="text-muted">Utilization:</small>
                              <div>{engineer.utilization}%</div>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>

              {/* Technical Skills */}
              <div className="mb-4">
                <h5 className="mb-3">💻 Technical Skills</h5>
                <Card className="bg-light border">
                  <Card.Body>
                    {engineer.skills && engineer.skills.length > 0 ? (
                      <>
                        <div className="mb-3">
                          <strong>Primary Skills:</strong>
                          <div className="mt-1">
                            {engineer.skills
                              .filter(skill => skill.level === 'primary')
                              .map((skill) => (
                                <Badge key={skill.id} bg="primary" className="me-2 mb-1">
                                  {skill.name} ⭐
                                </Badge>
                              ))}
                            {engineer.skills.filter(skill => skill.level === 'primary').length === 0 && (
                              <span className="text-muted">No primary skills specified</span>
                            )}
                          </div>
                        </div>
                        <div className="mb-3">
                          <strong>Secondary Skills:</strong>
                          <div className="mt-1">
                            {engineer.skills
                              .filter(skill => skill.level !== 'primary')
                              .map((skill) => (
                                <Badge key={skill.id} bg="secondary" className="me-2 mb-1">
                                  {skill.name}
                                </Badge>
                              ))}
                            {engineer.skills.filter(skill => skill.level !== 'primary').length === 0 && (
                              <span className="text-muted">No secondary skills specified</span>
                            )}
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Specialization:</strong> {engineer.industry_experience || 'Various Industries'}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Experience:</strong> {engineer.current_client ? `Currently at ${engineer.current_client}` : 'Available'}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted">No skills information available</p>
                    )}
                  </Card.Body>
                </Card>
              </div>

              {/* Availability & Timeline */}
              <div className="mb-4">
                <h5 className="mb-3">📅 Availability & Timeline</h5>
                <Card className="bg-light border">
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="mb-2">
                          <strong>Current:</strong> {
                            engineer.status === 'available' ? 'Available immediately' :
                            engineer.status === 'rolling_off_soon' ? 'Available soon' : 
                            engineer.status === 'on_bench' ? 'On bench' : 'On project'}
                        </div>
                        <div className="mb-2">
                          <strong>Notice Period:</strong> {engineer.notice_date ? 
                            `${Math.ceil((new Date(engineer.notice_date) - new Date()) / (1000 * 60 * 60 * 24))} days` : 
                            '2 weeks'}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-2">
                          <strong>Target Rate:</strong> {engineer.target_rate ? 
                            `$${engineer.target_rate}/hour` : 
                            'TBD'}
                        </div>
                        <div className="mb-2">
                          <strong>Preferred Duration:</strong> 3-12 months
                        </div>
                      </Col>
                    </Row>
                    {engineer.expected_end_date && (
                      <div className="mt-2">
                        <strong>Available From:</strong> {new Date(engineer.expected_end_date).toLocaleDateString()}
                      </div>
                    )}
                    {engineer.return_date && (
                      <div className="mt-2">
                        <strong>Expected Return:</strong> {new Date(engineer.return_date).toLocaleDateString()}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>

              {/* Best Match Opportunities */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">🎯 Best Match Opportunities</h5>
                  {matchesLoading && (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  )}
                </div>

                {matchingOpportunities.length > 0 ? (
                  <div className="row">
                    {matchingOpportunities.slice(0, 3).map((match, index) => {
                      const opportunity = match.opportunity;
                      const score = Math.round(match.score || 0);
                      const budgetCheck = getBudgetCompatibility(
                        engineer.target_rate,
                        opportunity.budget
                      );

                      return (
                        <Col key={opportunity.id} lg={4} className="mb-3">
                          <Card className="h-100 border">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-3">
                                <span className="fs-4 me-2">
                                  {getMatchScoreEmoji(score)}
                                </span>
                                <div>
                                  <h6 className="mb-1">{opportunity.client?.name || 'Client'}</h6>
                                  <Badge bg={getMatchScoreColor(score)}>
                                    {score}% Match
                                  </Badge>
                                  <small className="text-muted ms-2">
                                    {opportunity.status === 'active' ? 'Active' : opportunity.status}
                                  </small>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="small mb-1">
                                  <strong>Role:</strong> {opportunity.title || opportunity.job_role || 'Developer'}
                                </div>
                                <div className="small mb-1">
                                  <strong>Skills:</strong> {opportunity.skills ? 
                                    opportunity.skills.slice(0, 2).map(skill => skill.name).join(', ') : 
                                    'Various'}
                                </div>
                                <div className="small mb-1">
                                  <strong>Timeline:</strong> {opportunity.duration || '6 months'}
                                </div>
                                <div className="small mb-1">
                                  <strong>Budget:</strong> {opportunity.budget ? 
                                    `$${opportunity.budget >= 1000 ? opportunity.budget.toLocaleString() : opportunity.budget + 'k'}` : 
                                    'TBD'}
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="d-flex align-items-center small">
                                  <span>{budgetCheck.icon}</span>
                                  <span className="ms-1">{budgetCheck.text}</span>
                                </div>
                                {match.explanation && (
                                  <div className="small text-muted mt-1">
                                    {match.explanation}
                                  </div>
                                )}
                              </div>

                              <div className="d-grid gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleViewOpportunity(opportunity.id)}
                                >
                                  View Profile
                                </Button>
                                <Button
                                  variant="success"
                                  size="sm"
                                >
                                  Contact
                                </Button>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                >
                                  Add to Pipeline
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </div>
                ) : matchesLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" className="mb-2" />
                    <p className="text-muted">Finding matching opportunities...</p>
                  </div>
                ) : (
                  <Card className="text-center">
                    <Card.Body className="py-5">
                      <div className="text-muted">
                        <div className="mb-2" style={{ fontSize: '3rem' }}>🔍</div>
                        <h5>No Matching Opportunities</h5>
                        <p>No suitable opportunities found for this engineer at the moment.</p>
                        <Button
                          variant="primary"
                          onClick={fetchMatchingOpportunities}
                          disabled={matchesLoading}
                        >
                          Refresh Matches
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EngineerDetail;
