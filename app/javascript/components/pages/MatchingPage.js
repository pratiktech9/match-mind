import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge,
  Table, Pagination, Spinner, Alert, Modal
} from 'react-bootstrap';

const MatchingPage = ({ searchQuery = '', onNavigate }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
    engineer_id: '',
    min_score: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const itemsPerPage = 20;

  // Memoized filter string to prevent unnecessary re-renders
  const filterString = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  const fetchMatches = useCallback(async () => {
    // Only show full loading on initial load
    const isInitialLoad = matches.length === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setDataLoading(true);
    }

    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        ...filters
      });

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const response = await fetch(`/api/matches?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatches(data.data || []);
      setTotalPages(data.meta?.total_pages || 1);
      setTotalCount(data.meta?.total_count || 0);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, [currentPage, filterString, searchQuery, matches.length]);

  // Debounced version of fetchMatches for filter changes
  const debouncedFetchMatches = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      fetchMatches();
    }, 300); // 300ms delay

    setDebounceTimer(timer);
  }, [fetchMatches, debounceTimer]);

  useEffect(() => {
    fetchMatches();
  }, [currentPage, searchQuery]); // Only immediate fetch for page/search changes

  useEffect(() => {
    if (filterString !== '{}') { // Only debounce when filters actually exist
      debouncedFetchMatches();
    }
  }, [filterString]); // Debounced fetch for filter changes

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'batch') {
      // Handle batch filter updates (for quick filter buttons)
      setFilters(value);
      setCurrentPage(1);
    } else {
      // Handle individual filter changes
      setFilters(prev => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    }
  }, []);

  const handleTriggerMatching = async (opportunityId = null) => {
    setTriggering(true);

    try {
      const body = opportunityId ? { opportunity_id: opportunityId } : {};
      const response = await fetch('/api/matching/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Show success message
      setShowTriggerModal(false);
      alert(data.message + '. The matching process is running in the background.');

      // Refresh matches after a short delay
      window.setTimeout(() => {
        fetchMatches();
      }, 2000);

    } catch (err) {
      console.error('Error triggering matching:', err);
      alert('Failed to trigger matching process. Please try again.');
    } finally {
      setTriggering(false);
    }
  };

  const handleStatusChange = async (matchId, newStatus) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();

      // Update the match in the list
      setMatches(prev => prev.map(match =>
        match.id === matchId ? { ...match, status: newStatus } : match
      ));

    } catch (err) {
      console.error('Error updating match status:', err);
      alert('Failed to update match status. Please try again.');
    }
  };


  const getScoreBadgeVariant = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return '🥇';
    if (score >= 85) return '🥈';
    if (score >= 70) return '🥉';
    return '📊';
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
              <p className="text-muted">Loading matches...</p>
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
              <Button variant="outline-danger" onClick={fetchMatches}>
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
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-0">⚡ AI Matching Center</h4>
                  <small className="text-muted">
                    {totalCount} match{totalCount !== 1 ? 'es' : ''} found
                  </small>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowTriggerModal(true)}
                    disabled={triggering}
                  >
                    {triggering ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      '🚀 Trigger Matching'
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Filters Section */}
              <FilterSection filters={filters} onFilterChange={handleFilterChange} />

              {/* Matches Table */}
              <div className="table-responsive position-relative">
                {dataLoading && (
                  <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 10 }}>
                    <Spinner animation="border" size="sm" />
                  </div>
                )}
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">Match</th>
                      <th className="border-0">Engineer</th>
                      <th className="border-0">Opportunity</th>
                      <th className="border-0">Score</th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Matched</th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.length > 0 ? (
                      matches.map((match) => (
                        <tr key={match.id}>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <span className="fs-5 me-2">
                                {getScoreIcon(match.score)}
                              </span>
                              <div>
                                <div className="small fw-semibold">Match #{match.id}</div>
                                <div className="small text-muted">
                                  {match.client.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle me-2">
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{ width: '32px', height: '32px', fontSize: '14px' }}
                                >
                                  {match.engineer.name.charAt(0)}
                                </div>
                              </div>
                              <div>
                                <div className="fw-semibold">{match.engineer.name}</div>
                                <div className="small text-muted">{match.engineer.country}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="fw-semibold">
                                {match.opportunity ? match.opportunity.title : 'General Match'}
                              </div>
                              <div className="small text-muted">
                                {match.opportunity ? match.opportunity.job_role : match.client.industry}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <Badge
                                bg={getScoreBadgeVariant(match.score)}
                                className="me-2"
                              >
                                {Math.round(match.score)}%
                              </Badge>
                              {match.score >= 90 && <span className="small text-success">Excellent</span>}
                              {match.score >= 75 && match.score < 90 && <span className="small text-info">Good</span>}
                              {match.score >= 60 && match.score < 75 && <span className="small text-warning">Fair</span>}
                              {match.score < 60 && <span className="small text-danger">Poor</span>}
                            </div>
                          </td>
                          <td className="py-3">
                            <Form.Select
                              size="sm"
                              value={match.status}
                              onChange={(e) => handleStatusChange(match.id, e.target.value)}
                              style={{ minWidth: '120px' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="interested">Interested</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Hired</option>
                              <option value="archived">Archived</option>
                            </Form.Select>
                          </td>
                          <td className="py-3">
                            <div className="small text-muted">
                              {match.matched_at ?
                                new Date(match.matched_at).toLocaleDateString() :
                                new Date(match.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onNavigate('engineer-detail', { engineerId: match.engineer.id })}
                              >
                                Engineer
                              </Button>
                              {match.opportunity && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => onNavigate('opportunity-detail', { opportunityId: match.opportunity.id })}
                                >
                                  Opportunity
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className="text-muted">
                            <div className="mb-2" style={{ fontSize: '3rem' }}>⚡</div>
                            <h5>No Matches Found</h5>
                            <p>Try running the matching process or adjusting your filters.</p>
                            <Button
                              variant="primary"
                              onClick={() => setShowTriggerModal(true)}
                            >
                              Trigger Matching Process
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-top bg-light">
                  <Row className="align-items-center">
                    <Col>
                      <small className="text-muted">
                        Showing page {currentPage} of {totalPages} ({totalCount} total matches)
                      </small>
                    </Col>
                    <Col xs="auto">
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        />
                        <Pagination.Prev
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        />

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = Math.max(1, currentPage - 2) + i;
                          if (pageNumber > totalPages) return null;

                          return (
                            <Pagination.Item
                              key={pageNumber}
                              active={pageNumber === currentPage}
                              onClick={() => setCurrentPage(pageNumber)}
                            >
                              {pageNumber}
                            </Pagination.Item>
                          );
                        })}

                        <Pagination.Next
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Trigger Matching Modal */}
      <Modal show={showTriggerModal} onHide={() => setShowTriggerModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🚀 Trigger Matching Process</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This will run the AI matching algorithm to find the best matches between engineers and open opportunities.</p>
          <div className="bg-light p-3 rounded">
            <h6>What this does:</h6>
            <ul className="mb-0">
              <li>Analyzes all active opportunities</li>
              <li>Matches them with available engineers</li>
              <li>Calculates compatibility scores</li>
              <li>Updates the matches database</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTriggerModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleTriggerMatching()}
            disabled={triggering}
          >
            {triggering ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              '🚀 Start Matching'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Memoized Filter Components to prevent unnecessary re-renders
const FilterSection = memo(({ filters, onFilterChange }) => {
  return (
    <div className="p-3 bg-light border-bottom">
      <Row>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Status</Form.Label>
            <Form.Select
              size="sm"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
              <option value="archived">Archived</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Min Score</Form.Label>
            <Form.Select
              size="sm"
              value={filters.min_score}
              onChange={(e) => onFilterChange('min_score', e.target.value)}
            >
              <option value="">Any Score</option>
              <option value="90">90% and above</option>
              <option value="80">80% and above</option>
              <option value="70">70% and above</option>
              <option value="60">60% and above</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Quick Filters</Form.Label>
            <div className="d-flex gap-2">
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => {
                  onFilterChange('batch', { status: '', client_id: '', engineer_id: '', min_score: '80' });
                }}
              >
                High Scores
              </Button>
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => {
                  onFilterChange('batch', { status: 'pending', client_id: '', engineer_id: '', min_score: '' });
                }}
              >
                New Matches
              </Button>
            </div>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Actions</Form.Label>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  onFilterChange('batch', { status: '', client_id: '', engineer_id: '', min_score: '' });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default MatchingPage;
