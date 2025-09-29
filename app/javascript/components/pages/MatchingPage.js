import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const fetchMatchesRef = useRef(null);
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
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [recentMatches, setRecentMatches] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);

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
      setHasInitiallyLoaded(true);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, [currentPage, searchQuery, filters, itemsPerPage]);

  // Store the current fetchMatches in ref
  useEffect(() => {
    fetchMatchesRef.current = fetchMatches;
  }, [fetchMatches]);

  // Debounced version of fetchMatches for filter changes
  const debouncedFetchMatches = useCallback(() => {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }

    const timer = window.setTimeout(() => {
      if (fetchMatchesRef.current) {
        fetchMatchesRef.current();
      }
    }, 300); // 300ms delay

    setDebounceTimer(timer);
  }, []); // No dependencies to prevent recreation

  // Initial load
  useEffect(() => {
    if (!hasInitiallyLoaded && fetchMatchesRef.current) {
      fetchMatchesRef.current();
    }
  }, [hasInitiallyLoaded]);

  // Handle page and search changes (immediate) - only when not initial load
  useEffect(() => {
    if (hasInitiallyLoaded && fetchMatchesRef.current) {
      fetchMatchesRef.current();
    }
  }, [currentPage, searchQuery, hasInitiallyLoaded]);

  // Handle filter changes (debounced) - separate from other triggers
  useEffect(() => {
    if (hasInitiallyLoaded && filterString !== '{}') {
      debouncedFetchMatches();
    }
  }, [filterString, hasInitiallyLoaded]);

  // Cleanup debounce timer and polling on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, [debounceTimer, pollingInterval]);

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

  const fetchRecentMatches = useCallback(async () => {
    try {
      const response = await fetch('/api/matches/recent');
      if (response.ok) {
        const data = await response.json();
        const newMatches = data.matches || [];
        setRecentMatches(newMatches);

        // Merge recent matches into the main table
        if (newMatches.length > 0) {
          setMatches(prevMatches => {
            // Create a map of existing matches by ID to avoid duplicates
            const existingMatchIds = new Set(prevMatches.map(match => match.id));

            // Convert recent matches to the same format as main matches
            const formattedRecentMatches = newMatches
              .filter(match => !existingMatchIds.has(match.id))
              .map(match => ({
                id: match.id,
                engineer: {
                  id: match.engineer.id,
                  name: match.engineer.name,
                  country: match.engineer.country,
                  status: match.engineer.status
                },
                client: {
                  name: match.opportunity.client
                },
                opportunity: {
                  id: match.opportunity.id,
                  title: match.opportunity.title,
                  job_role: 'Developer' // Default role
                },
                score: match.score,
                status: match.status,
                matched_at: match.created_at,
                created_at: match.created_at,
                updated_at: match.created_at
              }));

            // Combine and sort by creation time (newest first)
            const combinedMatches = [...formattedRecentMatches, ...prevMatches]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return combinedMatches;
          });

          // Update total count
          setTotalCount(prev => prev + newMatches.length);
        }
      }
    } catch (err) {
      console.error('Error fetching recent matches:', err);
    }
  }, []);

  const startPolling = useCallback(() => {
    // Clear any existing polling
    if (pollingInterval) {
      window.clearInterval(pollingInterval);
    }

    // Start polling every 2 seconds
    const interval = window.setInterval(() => {
      fetchRecentMatches();
    }, 2000);

    setPollingInterval(interval);
  }, [pollingInterval, fetchRecentMatches]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      window.clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

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

      await response.json();

      // Show success message and start real-time updates
      setShowTriggerModal(false);
      setMatchingInProgress(true);
      startPolling();

      // Stop polling after 5 minutes
      window.setTimeout(() => {
        stopPolling();
        setMatchingInProgress(false);
        fetchMatches(); // Final refresh
      }, 5 * 60 * 1000);

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
                    {matchingInProgress && (
                      <span className="text-success ms-2">
                        <Spinner animation="border" size="sm" className="me-1" />
                        Matching in progress... ({recentMatches.length} new)
                      </span>
                    )}
                  </small>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowTriggerModal(true)}
                    disabled={triggering || matchingInProgress}
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
              {/* Real-time Matching Progress */}
              {matchingInProgress && (
                <div className="p-3 bg-success bg-opacity-10 border-bottom">
                  <Row className="align-items-center">
                    <Col>
                      <h6 className="mb-1 text-success">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Live Matching Results
                      </h6>
                      <small className="text-muted">
                        {recentMatches.length} new match{recentMatches.length !== 1 ? 'es' : ''} found in the last 5 minutes
                        {recentMatches.length > 0 && ' - Check the table below for details'}
                      </small>
                    </Col>
                    <Col xs="auto">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => {
                          stopPolling();
                          setMatchingInProgress(false);
                          fetchMatches(); // Full refresh to get all data
                        }}
                      >
                        Stop & Refresh
                      </Button>
                    </Col>
                  </Row>
                  {recentMatches.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Latest matches:</small>
                      <div className="mt-1">
                        {recentMatches.slice(0, 3).map((match) => (
                          <Badge key={match.id} bg="success" className="me-2 mb-1">
                            {match.engineer.name} → {match.opportunity.title} ({Math.round(match.score)}%)
                          </Badge>
                        ))}
                        {recentMatches.length > 3 && (
                          <Badge bg="secondary" className="me-2 mb-1">
                            +{recentMatches.length - 3} more...
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
              <li>Calculates compatibility scores using AI</li>
              <li>Updates the matches database in real-time</li>
            </ul>
          </div>
          <div className="bg-info bg-opacity-10 p-3 rounded mt-3">
            <h6 className="text-info">✨ New Feature:</h6>
            <p className="mb-0 small">
              You&apos;ll see matches appear in real-time as they&apos;re processed. No more waiting for the entire process to complete!
            </p>
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
