import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge,
  Table, Pagination, Spinner, Alert
} from 'react-bootstrap';

const EngineersList = ({ searchQuery = '' }) => {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    skills: '',
    availability: '',
    experience: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const itemsPerPage = 10;

  const fetchEngineers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: searchQuery,
        ...filters
      });

      const response = await fetch(`/api/v1/engineers?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEngineers(data.data || []);
      setTotalPages(data.meta?.total_pages || 1);
    } catch (err) {
      console.error('Error fetching engineers:', err);
      setError('Failed to load engineers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortBy, sortOrder, searchQuery]);

  // Fetch engineers data
  useEffect(() => {
    fetchEngineers();
  }, [fetchEngineers]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      available: 'success',
      rolling_off: 'warning',
      on_bench: 'info',
      allocated: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
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
              <p className="text-muted">Loading engineers...</p>
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
              <Button variant="outline-danger" onClick={fetchEngineers}>
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
                  <h4 className="mb-0">Engineers Directory</h4>
                  <small className="text-muted">
                    {engineers.length} engineer{engineers.length !== 1 ? 's' : ''} found
                  </small>
                </Col>
                <Col xs="auto">
                  <Button variant="primary" size="sm">
                    + Add Engineer
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Filters Section */}
              <div className="p-3 bg-light border-bottom">
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Status</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="rolling_off">Rolling Off</option>
                        <option value="on_bench">On Bench</option>
                        <option value="allocated">Allocated</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Skills</Form.Label>
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="e.g. React, Python"
                        value={filters.skills}
                        onChange={(e) => handleFilterChange('skills', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Availability</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.availability}
                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                      >
                        <option value="">Any Time</option>
                        <option value="immediate">Immediate</option>
                        <option value="within_week">Within a Week</option>
                        <option value="within_month">Within a Month</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Experience</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.experience}
                        onChange={(e) => handleFilterChange('experience', e.target.value)}
                      >
                        <option value="">All Levels</option>
                        <option value="junior">Junior (0-2 years)</option>
                        <option value="mid">Mid (3-5 years)</option>
                        <option value="senior">Senior (6-8 years)</option>
                        <option value="lead">Lead (9+ years)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Engineers Table */}
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('name')}
                        className="border-0"
                      >
                        Engineer {getSortIcon('name')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('status')}
                        className="border-0"
                      >
                        Status {getSortIcon('status')}
                      </th>
                      <th className="border-0">Skills</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('experience_years')}
                        className="border-0"
                      >
                        Experience {getSortIcon('experience_years')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('availability_date')}
                        className="border-0"
                      >
                        Availability {getSortIcon('availability_date')}
                      </th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineers.length > 0 ? (
                      engineers.map((engineer) => (
                        <tr key={engineer.id}>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle me-3">
                                {engineer.image_url ? (
                                  <img
                                    src={engineer.image_url}
                                    alt={engineer.name}
                                    className="rounded-circle"
                                    width="40"
                                    height="40"
                                  />
                                ) : (
                                  <div
                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                    style={{ width: '40px', height: '40px', fontSize: '16px' }}
                                  >
                                    {engineer.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="fw-semibold">{engineer.name}</div>
                                <div className="text-muted small">{engineer.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={getStatusBadgeVariant(engineer.status)}
                              className="px-2 py-1"
                            >
                              {formatStatus(engineer.status)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="skills-list">
                              {engineer.skills && engineer.skills.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {engineer.skills.slice(0, 3).map((skill, index) => (
                                    <Badge
                                      key={index}
                                      bg="light"
                                      text="dark"
                                      className="px-2 py-1 small border"
                                    >
                                      {skill.name}
                                    </Badge>
                                  ))}
                                  {engineer.skills.length > 3 && (
                                    <Badge
                                      bg="secondary"
                                      className="px-2 py-1 small"
                                    >
                                      +{engineer.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted small">No skills listed</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="fw-medium">{engineer.experience_years} years</span>
                          </td>
                          <td className="py-3">
                            {engineer.availability_date ? (
                              <span className="text-muted">
                                {new Date(engineer.availability_date).toLocaleDateString()}
                              </span>
                            ) : (
                              <Badge bg="success">Available Now</Badge>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="d-flex gap-2">
                              <Button variant="outline-primary" size="sm">
                                View
                              </Button>
                              <Button variant="outline-secondary" size="sm">
                                Match
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="text-muted">
                            <div className="mb-2" style={{ fontSize: '3rem' }}>🔍</div>
                            <h5>No Engineers Found</h5>
                            <p>Try adjusting your search criteria or filters.</p>
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
                        Showing page {currentPage} of {totalPages}
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
    </Container>
  );
};

export default EngineersList;
