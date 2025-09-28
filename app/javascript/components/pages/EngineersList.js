import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge,
  Table, Pagination, Spinner, Alert, Modal
} from 'react-bootstrap';

const EngineersList = ({ searchQuery = '', onNavigate }) => {
  const [engineers, setEngineers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
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

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [newEngineer, setNewEngineer] = useState({
    name: '',
    email: '',
    country: '',
    status: 'available',
    current_client: '',
    industry_experience: '',
    notice_date: '',
    expected_end_date: '',
    return_date: '',
    notes: '',
    utilization: '',
    target_rate: '',
    skill_ids: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const itemsPerPage = 10;

  // Memoized filter string to prevent unnecessary re-renders
  const filterString = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  const fetchEngineers = useCallback(async () => {
    // Only show full loading on initial load
    const isInitialLoad = engineers.length === 0;

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
      setDataLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery, engineers.length, filters]);

  // Debounced version of fetchEngineers for filter changes
  const debouncedFetchEngineers = useCallback(() => {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }

    const timer = window.setTimeout(() => {
      fetchEngineers();
    }, 300); // 300ms delay

    setDebounceTimer(timer);
  }, [fetchEngineers, debounceTimer]);

  // Fetch engineers data with different strategies
  useEffect(() => {
    fetchEngineers();
  }, [currentPage, sortBy, sortOrder, searchQuery, fetchEngineers]); // Immediate fetch for pagination, sorting, search

  useEffect(() => {
    if (filterString !== JSON.stringify({status:'',skills:'',availability:'',experience:''})) {
      debouncedFetchEngineers();
    }
  }, [filterString, debouncedFetchEngineers]); // Debounced fetch for filter changes

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Fetch skills for form
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/v1/skills');
      const data = await response.json();
      setSkills(data.data || []);
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleViewEngineer = (engineerId) => {
    if (onNavigate) {
      onNavigate('engineer-detail', { engineerId });
    }
  };

  // Modal handlers
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewEngineer({
      name: '',
      email: '',
      country: '',
      status: 'available',
      current_client: '',
      industry_experience: '',
      notice_date: '',
      expected_end_date: '',
      return_date: '',
      notes: '',
      utilization: '',
      target_rate: '',
      skill_ids: []
    });
    setSubmitting(false);
    setModalError(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingEngineer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEngineer(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingEngineer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitEngineer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const response = await fetch('/api/v1/engineers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ engineer: newEngineer })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create engineer');
      }

      await fetchEngineers(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error('Error creating engineer:', err);
      setModalError(err.message || 'Failed to create engineer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEngineer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const response = await fetch(`/api/v1/engineers/${editingEngineer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ engineer: editingEngineer })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update engineer');
      }

      await fetchEngineers(); // Refresh the list
      handleCloseEditModal();
    } catch (err) {
      console.error('Error updating engineer:', err);
      setModalError(err.message || 'Failed to update engineer. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  const handleEditEngineer = (engineer) => {
    setModalError(null);
    setEditingEngineer({
      ...engineer,
      skill_ids: engineer.skills?.map(skill => skill.id) || []
    });
    setShowEditModal(true);
  };

  const handleSkillChange = (e, isEdit = false) => {
    const { options } = e.target;
    const selectedIds = Array.from(options)
      .filter(option => option.selected)
      .map(option => parseInt(option.value));

    if (isEdit) {
      setEditingEngineer(prev => ({ ...prev, skill_ids: selectedIds }));
    } else {
      setNewEngineer(prev => ({ ...prev, skill_ids: selectedIds }));
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
                  <Button variant="primary" size="sm" onClick={handleShowAddModal}>
                    + Add Engineer
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Filters Section */}
              <EngineersFilterSection filters={filters} onFilterChange={handleFilterChange} skills={skills} />

              {/* Engineers Table */}
              <div className="table-responsive position-relative">
                {dataLoading && (
                  <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 10 }}>
                    <Spinner animation="border" size="sm" />
                  </div>
                )}
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
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewEngineer(engineer.id)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleEditEngineer(engineer)}
                              >
                                Edit
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

      {/* Add Engineer Modal */}
      <Modal show={showAddModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Engineer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setModalError(null)}>
              {modalError}
            </Alert>
          )}
          <Form onSubmit={handleSubmitEngineer}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newEngineer.name}
                    onChange={handleInputChange}
                    placeholder="Enter engineer name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={newEngineer.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={newEngineer.country}
                    onChange={handleInputChange}
                    placeholder="e.g. United States"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={newEngineer.status}
                    onChange={handleInputChange}
                  >
                    <option value="available">Available</option>
                    <option value="available_soon">Available Soon</option>
                    <option value="busy">Busy</option>
                    <option value="rolling_off">Rolling Off</option>
                    <option value="on_bench">On Bench</option>
                    <option value="allocated">Allocated</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Client</Form.Label>
                  <Form.Control
                    type="text"
                    name="current_client"
                    value={newEngineer.current_client}
                    onChange={handleInputChange}
                    placeholder="Enter current client"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry Experience</Form.Label>
                  <Form.Control
                    type="text"
                    name="industry_experience"
                    value={newEngineer.industry_experience}
                    onChange={handleInputChange}
                    placeholder="e.g. FinTech, Healthcare"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Notice Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="notice_date"
                    value={newEngineer.notice_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expected_end_date"
                    value={newEngineer.expected_end_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Return Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="return_date"
                    value={newEngineer.return_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Rate ($/hour)</Form.Label>
                  <Form.Control
                    type="number"
                    name="target_rate"
                    value={newEngineer.target_rate}
                    onChange={handleInputChange}
                    placeholder="e.g. 150"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Utilization (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="utilization"
                    value={newEngineer.utilization}
                    onChange={handleInputChange}
                    placeholder="e.g. 80"
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Skills</Form.Label>
              <Form.Select
                multiple
                name="skill_ids"
                value={newEngineer.skill_ids.map(id => id.toString())}
                onChange={(e) => handleSkillChange(e, false)}
                style={{ height: '120px' }}
              >
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Hold Ctrl/Cmd to select multiple skills
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={newEngineer.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about the engineer"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitEngineer}
            disabled={submitting || !newEngineer.name || !newEngineer.email}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Create Engineer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Engineer Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Engineer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setModalError(null)}>
              {modalError}
            </Alert>
          )}
          {editingEngineer && (
            <Form onSubmit={handleUpdateEngineer}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={editingEngineer?.name || ''}
                    onChange={handleEditInputChange}
                    placeholder="Enter engineer name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editingEngineer?.email || ''}
                    onChange={handleEditInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={editingEngineer?.country || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. United States"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={editingEngineer?.status || ''}
                    onChange={handleEditInputChange}
                  >
                    <option value="available">Available</option>
                    <option value="available_soon">Available Soon</option>
                    <option value="busy">Busy</option>
                    <option value="rolling_off">Rolling Off</option>
                    <option value="on_bench">On Bench</option>
                    <option value="allocated">Allocated</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Client</Form.Label>
                  <Form.Control
                    type="text"
                    name="current_client"
                    value={editingEngineer?.current_client || ''}
                    onChange={handleEditInputChange}
                    placeholder="Enter current client"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry Experience</Form.Label>
                  <Form.Control
                    type="text"
                    name="industry_experience"
                    value={editingEngineer?.industry_experience || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. FinTech, Healthcare"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Notice Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="notice_date"
                    value={editingEngineer?.notice_date || ''}
                    onChange={handleEditInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expected_end_date"
                    value={editingEngineer?.expected_end_date || ''}
                    onChange={handleEditInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Return Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="return_date"
                    value={editingEngineer?.return_date || ''}
                    onChange={handleEditInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Utilization (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="utilization"
                    value={editingEngineer?.utilization || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. 80"
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Rate</Form.Label>
                  <Form.Control
                    type="number"
                    name="target_rate"
                    value={editingEngineer?.target_rate || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. 150"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Skills</Form.Label>
              <Form.Select
                multiple
                name="skill_ids"
                value={(editingEngineer?.skill_ids || []).map(id => id.toString())}
                onChange={(e) => handleSkillChange(e, true)}
                style={{ height: '120px' }}
              >
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Hold Ctrl/Cmd to select multiple skills
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={editingEngineer?.notes || ''}
                onChange={handleEditInputChange}
                placeholder="Additional notes about the engineer"
              />
            </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateEngineer}
            disabled={submitting || !editingEngineer?.name || !editingEngineer?.email}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Engineer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Memoized Filter Components to prevent unnecessary re-renders
const EngineersFilterSection = memo(({ filters, onFilterChange, skills }) => {
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
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="rolling_off">Rolling Off</option>
              <option value="on_bench">On Bench</option>
              <option value="assigned">Assigned</option>
              <option value="unavailable">Unavailable</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Skills</Form.Label>
            <Form.Select
              size="sm"
              value={filters.skills}
              onChange={(e) => onFilterChange('skills', e.target.value)}
            >
              <option value="">All Skills</option>
              {skills.map(skill => (
                <option key={skill.id} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Availability</Form.Label>
            <Form.Select
              size="sm"
              value={filters.availability}
              onChange={(e) => onFilterChange('availability', e.target.value)}
            >
              <option value="">All</option>
              <option value="immediate">Immediate</option>
              <option value="2_weeks">Within 2 weeks</option>
              <option value="1_month">Within 1 month</option>
              <option value="3_months">Within 3 months</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Experience</Form.Label>
            <Form.Select
              size="sm"
              value={filters.experience}
              onChange={(e) => onFilterChange('experience', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (3-5 years)</option>
              <option value="senior">Senior (6+ years)</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
});

EngineersFilterSection.displayName = 'EngineersFilterSection';

export default EngineersList;
