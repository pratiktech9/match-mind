import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Badge, Spinner, Alert,
  Modal
} from 'react-bootstrap';

const OpportunityDetail = ({ opportunityId, onNavigate }) => {
  const [opportunity, setOpportunity] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [matchCreating, setMatchCreating] = useState(false);

  const fetchOpportunityDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/opportunities/${opportunityId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOpportunity(data.data);
    } catch (err) {
      console.error('Error fetching opportunity details:', err);
      setError('Failed to load opportunity details.');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/matches`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      // Don't set error for matches, just log it
    } finally {
      setMatchesLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunityDetails();
      fetchMatches();
    }
  }, [opportunityId, fetchOpportunityDetails, fetchMatches]);

  const handleBackToList = () => {
    onNavigate('opportunities');
  };

  const handleContactEngineer = (engineer) => {
    setSelectedEngineer(engineer);
    setShowContactModal(true);
  };

  const handleCreateMatch = async (engineerId) => {
    setMatchCreating(true);

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          engineer_id: engineerId,
          opportunity_id: opportunityId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create match');
      }

      alert('Match created successfully!');
    } catch (err) {
      console.error('Error creating match:', err);
      alert('Failed to create match. Please try again.');
    } finally {
      setMatchCreating(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'danger';
  };

  const getMatchScoreEmoji = (score) => {
    if (score >= 90) return '🥇';
    if (score >= 75) return '🥈';
    return '🥉';
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      closed: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const getPriorityBadgeVariant = (priority) => {
    const variants = {
      low: 'secondary',
      medium: 'primary',
      high: 'warning',
      urgent: 'danger'
    };
    return variants[priority] || 'secondary';
  };

  const getBudgetCompatibility = (engineerRate, budget) => {
    if (!engineerRate || !budget) return { icon: '⚠️', text: 'Unknown budget' };

    const rate = parseInt(engineerRate.replace(/[^0-9]/g, ''));
    if (rate <= budget) return { icon: '✅', text: 'Within budget' };
    if (rate <= budget * 1.1) return { icon: '⚠️', text: 'Slightly above budget' };
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
              <p className="text-muted">Loading opportunity details...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error || !opportunity) {
    return (
      <Container fluid>
        <Row>
          <Col>
            <Alert variant="danger" className="mt-4">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error || 'Opportunity not found'}</p>
              <Button variant="outline-danger" onClick={handleBackToList}>
                Back to Opportunities
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
                        🏢 {opportunity.client?.name} - {opportunity.title}
                      </h3>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg={getStatusBadgeVariant(opportunity.status)}>
                          {opportunity.status}
                        </Badge>
                        <Badge bg={getPriorityBadgeVariant(opportunity.priority)}>
                          {opportunity.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body>
              {/* Opportunity Details */}
              <div className="mb-4">
                <h5 className="mb-3">📋 Opportunity Details</h5>
                <Card className="bg-light border">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <p className="mb-2">
                          <strong>Client:</strong> {opportunity.client?.name} Inc. ·
                          <strong> Budget:</strong> {opportunity.budget ? `$${opportunity.budget.toLocaleString()}` : 'TBD'}
                        </p>
                        <p className="mb-2">
                          <strong>Timeline:</strong> {
                            opportunity.start_date && opportunity.end_date
                              ? `${new Date(opportunity.start_date).toLocaleDateString()} - ${new Date(opportunity.end_date).toLocaleDateString()}`
                              : 'Flexible'
                          } · <strong>Start Date:</strong> {
                            opportunity.start_date
                              ? new Date(opportunity.start_date).toLocaleDateString()
                              : 'TBD'
                          }
                        </p>
                        <p className="mb-2">
                          <strong>Location:</strong> {opportunity.geo} ·
                          <strong> Type:</strong> {opportunity.employment_type}
                        </p>
                        <p className="mb-2">
                          <strong>Required Role:</strong> {opportunity.job_role}
                        </p>
                        {opportunity.description && (
                          <p className="mb-0">
                            <strong>Description:</strong> {opportunity.description}
                          </p>
                        )}
                      </Col>
                      <Col md={4}>
                        <div className="text-end">
                          <div className="mb-2">
                            <small className="text-muted">Industry:</small>
                            <div>{opportunity.client?.industry || 'Technology'}</div>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted">Created:</small>
                            <div>{new Date(opportunity.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>

              {/* Suggested Matches */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">👥 Suggested Matches</h5>
                  {matchesLoading && (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  )}
                </div>

                {matches.length > 0 ? (
                  <div className="row">
                    {matches.slice(0, 3).map((match) => {
                      const engineer = match.engineer;
                      const score = Math.round(match.score || 0);
                      const budgetCheck = getBudgetCompatibility(
                        engineer.target_rate,
                        opportunity.budget
                      );

                      return (
                        <Col key={engineer.id} lg={4} className="mb-3">
                          <Card className="h-100 border">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-3">
                                <span className="fs-4 me-2">
                                  {getMatchScoreEmoji(score)}
                                </span>
                                <div>
                                  <h6 className="mb-1">{engineer.name}</h6>
                                  <Badge bg={getMatchScoreColor(score)}>
                                    {score}% Match
                                  </Badge>
                                  <small className="text-muted ms-2">
                                    {engineer.status === 'available' ? 'Available Now' :
                                     engineer.status === 'rolling_off_soon' ? 'Available Soon' :
                                     'On Project'}
                                  </small>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="small mb-1">
                                  <strong>Skills:</strong>
                                  {engineer.skills?.slice(0, 3).map((skill, i) => (
                                    <span key={skill.id}>
                                      {i > 0 && ', '}{skill.name}
                                      {skill.level === 'primary' && ' ⭐'}
                                    </span>
                                  ))}
                                </div>
                                <div className="small mb-1">
                                  <strong>Location:</strong> {engineer.country} ·
                                  <strong> Rate:</strong> {engineer.target_rate ? `$${engineer.target_rate}k` : 'TBD'}
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
                                  onClick={() => handleContactEngineer(engineer)}
                                >
                                  View Profile
                                </Button>
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    className="flex-fill"
                                    onClick={() => handleCreateMatch(engineer.id)}
                                    disabled={matchCreating}
                                  >
                                    Contact
                                  </Button>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="flex-fill"
                                    onClick={() => handleCreateMatch(engineer.id)}
                                    disabled={matchCreating}
                                  >
                                    Add to Pipeline
                                  </Button>
                                </div>
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
                    <p className="text-muted">Finding matches...</p>
                  </div>
                ) : (
                  <Card className="text-center">
                    <Card.Body className="py-5">
                      <div className="text-muted">
                        <div className="mb-2" style={{ fontSize: '3rem' }}>🔍</div>
                        <h5>No Matches Found</h5>
                        <p>We couldn&apos;t find any suitable engineers for this opportunity at the moment.</p>
                        <Button
                          variant="primary"
                          onClick={fetchMatches}
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

      {/* Engineer Profile Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedEngineer ? `👤 ${selectedEngineer.name}` : 'Engineer Profile'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEngineer && (
            <div>
              <Card className="mb-3">
                <Card.Body>
                  <h6>📍 Basic Information</h6>
                  <p>
                    <strong>{selectedEngineer.name}</strong> · {selectedEngineer.email}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedEngineer.country} ·
                    <strong> Status:</strong> <Badge bg="success">{selectedEngineer.status}</Badge>
                  </p>
                  <p>
                    <strong>Target Rate:</strong> {selectedEngineer.target_rate ? `$${selectedEngineer.target_rate}k` : 'TBD'}
                  </p>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Body>
                  <h6>💻 Technical Skills</h6>
                  <div>
                    <strong>Skills:</strong> {selectedEngineer.skills?.map((skill, i) => (
                      <span key={skill.id}>
                        {i > 0 && ', '}{skill.name}
                        {skill.level === 'primary' && ' ⭐'}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    <strong>Industry Experience:</strong> {selectedEngineer.industry_experience || 'Various'}
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <h6>📅 Availability</h6>
                  <p>
                    <strong>Current Status:</strong> {selectedEngineer.status === 'available' ? 'Available immediately' : 'On project'}
                  </p>
                  {selectedEngineer.expected_end_date && (
                    <p>
                      <strong>Available From:</strong> {new Date(selectedEngineer.expected_end_date).toLocaleDateString()}
                    </p>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContactModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCreateMatch(selectedEngineer?.id);
              setShowContactModal(false);
            }}
            disabled={matchCreating}
          >
            Contact Engineer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OpportunityDetail;
