import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge,
  Table, Pagination, Spinner, Alert, Modal
} from 'react-bootstrap';

const OpportunitiesList = ({ searchQuery = '', onNavigate, clientFilter = null }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    client_id: '',
    status: '',
    priority: '',
    employment_type: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [newOpportunity, setNewOpportunity] = useState({
    client_id: '',
    title: '',
    description: '',
    geo: '',
    employment_type: '',
    job_role: '',
    status: 'active',
    priority: 'medium',
    budget: '',
    start_date: '',
    end_date: '',
    skill_ids: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const itemsPerPage = 10;

  // Memoized filter string to prevent unnecessary re-renders
  const filterString = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  const fetchOpportunities = useCallback(async (customFilters = null) => {
    // Only show full loading on initial load
    const isInitialLoad = opportunities.length === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setDataLoading(true);
    }

    setError(null);

    try {
      const queryParams = new URLSearchParams();

      // Add basic params
      queryParams.append('page', currentPage);
      queryParams.append('per_page', itemsPerPage);
      queryParams.append('sort_by', sortBy);
      queryParams.append('sort_order', sortOrder);

      // Add search query if present
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      // Use custom filters if provided, otherwise use current filters
      const filtersToUse = customFilters || filters;

      // Add filters only if they have values
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/v1/opportunities?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOpportunities(data.data || []);
      setTotalPages(data.meta?.total_pages || 1);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to load opportunities. Please try again.');
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery, opportunities.length, filters]);

  // Separate effect for initial load and pagination/sorting/search
  useEffect(() => {
    fetchOpportunities();
    setHasInitiallyLoaded(true);
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  // Separate effect for filter changes with debouncing
  useEffect(() => {
    // Skip if we haven't done the initial load yet
    if (!hasInitiallyLoaded) return;

    // Always trigger filter changes, including when clearing filters
    // Clear existing timer
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }

    // Set up new debounced timer
    const timer = window.setTimeout(() => {
      fetchOpportunities(filters);
    }, 300);

    setDebounceTimer(timer);

    // Cleanup function
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [filterString, hasInitiallyLoaded]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  useEffect(() => {
    fetchClients();
  }, []);

  // Set client filter when provided via navigation
  useEffect(() => {
    if (clientFilter) {
      setFilters(prev => ({ ...prev, client_id: clientFilter }));
    }
  }, [clientFilter]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/v1/clients');
      const data = await response.json();
      setClients(data.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };


  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Only update if there's actually a change
      if (JSON.stringify(newFilters) !== JSON.stringify(prev)) {
        return newFilters;
      }
      return prev;
    });
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

  const handleViewOpportunity = (opportunityId) => {
    if (onNavigate) {
      onNavigate('opportunity-detail', { opportunityId });
    }
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

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Modal handlers
  const handleAddOpportunity = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewOpportunity({
      client_id: '',
      title: '',
      description: '',
      geo: '',
      employment_type: '',
      job_role: '',
      status: 'active',
      priority: 'medium',
      budget: '',
      start_date: '',
      end_date: '',
      skill_ids: []
    });
    setSubmitting(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingOpportunity(null);
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOpportunity(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingOpportunity(prev => ({ ...prev, [name]: value }));
  };

  const handleEditOpportunity = (opportunity) => {
    setEditingOpportunity({ ...opportunity });
    setShowEditModal(true);
  };

  const handleSubmitOpportunity = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/v1/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          opportunity: newOpportunity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create opportunity');
      }

      const data = await response.json();

      // Add the new opportunity to the list
      setOpportunities(prev => [data.data, ...prev]);

      // Close modal and reset form
      handleCloseModal();

      alert('Opportunity created successfully!');

    } catch (err) {
      console.error('Error creating opportunity:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOpportunity = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/v1/opportunities/${editingOpportunity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          opportunity: {
            client_id: editingOpportunity.client_id,
            title: editingOpportunity.title,
            description: editingOpportunity.description,
            geo: editingOpportunity.geo,
            employment_type: editingOpportunity.employment_type,
            job_role: editingOpportunity.job_role,
            status: editingOpportunity.status,
            priority: editingOpportunity.priority,
            budget: editingOpportunity.budget,
            start_date: editingOpportunity.start_date,
            end_date: editingOpportunity.end_date
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update opportunity');
      }

      const data = await response.json();

      // Update the opportunity in the list
      setOpportunities(prev => prev.map(opportunity =>
        opportunity.id === editingOpportunity.id ? data.data : opportunity
      ));

      // Close modal and reset form
      handleCloseEditModal();

      alert('Opportunity updated successfully!');

    } catch (err) {
      console.error('Error updating opportunity:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
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
              <p className="text-muted">Loading opportunities...</p>
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
              <Button variant="outline-danger" onClick={fetchOpportunities}>
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
                  <h4 className="mb-0">Opportunities Directory</h4>
                  <small className="text-muted">
                    {opportunities.length} opportunit{opportunities.length !== 1 ? 'ies' : 'y'} found
                  </small>
                </Col>
                <Col xs="auto">
                  <Button variant="primary" size="sm" onClick={handleAddOpportunity}>
                    + Add Opportunity
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Filters Section */}
              <OpportunitiesFilterSection filters={filters} onFilterChange={handleFilterChange} clients={clients} />

              {/* Opportunities Table */}
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
                        onClick={() => handleSort('title')}
                        className="border-0"
                      >
                        Opportunity {getSortIcon('title')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('client_id')}
                        className="border-0"
                      >
                        Client {getSortIcon('client_id')}
                      </th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Priority</th>
                      <th className="border-0">Budget</th>
                      <th className="border-0">Location</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('created_at')}
                        className="border-0"
                      >
                        Created {getSortIcon('created_at')}
                      </th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.length > 0 ? (
                      opportunities.map((opportunity) => (
                        <tr key={opportunity.id}>
                          <td className="py-3">
                            <div>
                              <div className="fw-semibold">{opportunity.title}</div>
                              <div className="text-muted small">{opportunity.job_role}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg="light"
                              text="dark"
                              className="px-2 py-1 border"
                            >
                              {opportunity.client?.name || 'N/A'}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={getStatusBadgeVariant(opportunity.status)}
                              className="px-2 py-1"
                            >
                              {opportunity.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={getPriorityBadgeVariant(opportunity.priority)}
                              className="px-2 py-1"
                            >
                              {opportunity.priority}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className="fw-medium">
                              {opportunity.budget ? `$${opportunity.budget.toLocaleString()}` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-muted">{opportunity.geo}</span>
                          </td>
                          <td className="py-3">
                            <span className="text-muted">
                              {new Date(opportunity.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewOpportunity(opportunity.id)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditOpportunity(opportunity)}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <div className="text-muted">
                            <div className="mb-2" style={{ fontSize: '3rem' }}>💼</div>
                            <h5>No Opportunities Found</h5>
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

      {/* Add Opportunity Modal */}
      <Modal show={showAddModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Opportunity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitOpportunity}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client *</Form.Label>
                  <Form.Select
                    name="client_id"
                    value={newOpportunity.client_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={newOpportunity.title}
                    onChange={handleInputChange}
                    placeholder="Enter opportunity title"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newOpportunity.description}
                onChange={handleInputChange}
                placeholder="Enter opportunity description"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="geo"
                    value={newOpportunity.geo}
                    onChange={handleInputChange}
                    placeholder="e.g. Remote, San Francisco"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Employment Type *</Form.Label>
                  <Form.Select
                    name="employment_type"
                    value={newOpportunity.employment_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Role *</Form.Label>
                  <Form.Control
                    type="text"
                    name="job_role"
                    value={newOpportunity.job_role}
                    onChange={handleInputChange}
                    placeholder="e.g. Backend Developer"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={newOpportunity.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={newOpportunity.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Budget</Form.Label>
                  <Form.Control
                    type="number"
                    name="budget"
                    value={newOpportunity.budget}
                    onChange={handleInputChange}
                    placeholder="Enter budget amount"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={newOpportunity.start_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={newOpportunity.end_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitOpportunity}
            disabled={submitting || !newOpportunity.client_id || !newOpportunity.title}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Create Opportunity'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Opportunity Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Opportunity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateOpportunity}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client *</Form.Label>
                  <Form.Select
                    name="client_id"
                    value={editingOpportunity?.client_id || ''}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={editingOpportunity?.title || ''}
                    onChange={handleEditInputChange}
                    placeholder="Enter opportunity title"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={editingOpportunity?.description || ''}
                onChange={handleEditInputChange}
                placeholder="Enter opportunity description"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="geo"
                    value={editingOpportunity?.geo || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Remote, San Francisco"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Employment Type *</Form.Label>
                  <Form.Select
                    name="employment_type"
                    value={editingOpportunity?.employment_type || ''}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Role *</Form.Label>
                  <Form.Control
                    type="text"
                    name="job_role"
                    value={editingOpportunity?.job_role || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Backend Developer"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={editingOpportunity?.status || ''}
                    onChange={handleEditInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={editingOpportunity?.priority || ''}
                    onChange={handleEditInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Budget</Form.Label>
                  <Form.Control
                    type="number"
                    name="budget"
                    value={editingOpportunity?.budget || ''}
                    onChange={handleEditInputChange}
                    placeholder="Enter budget amount"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={editingOpportunity?.start_date || ''}
                    onChange={handleEditInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={editingOpportunity?.end_date || ''}
                    onChange={handleEditInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateOpportunity}
            disabled={submitting || !editingOpportunity?.client_id || !editingOpportunity?.title}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Opportunity'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Memoized Filter Components to prevent unnecessary re-renders
const OpportunitiesFilterSection = memo(({ filters, onFilterChange, clients }) => {
  return (
    <div className="p-3 bg-light border-bottom">
      <Row>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Client</Form.Label>
            <Form.Select
              size="sm"
              value={filters.client_id}
              onChange={(e) => onFilterChange('client_id', e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Status</Form.Label>
            <Form.Select
              size="sm"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="filled">Filled</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Priority</Form.Label>
            <Form.Select
              size="sm"
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted">Employment Type</Form.Label>
            <Form.Select
              size="sm"
              value={filters.employment_type}
              onChange={(e) => onFilterChange('employment_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
});

OpportunitiesFilterSection.displayName = 'OpportunitiesFilterSection';

export default OpportunitiesList;
