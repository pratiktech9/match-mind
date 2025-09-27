import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge,
  Table, Pagination, Spinner, Alert, Modal
} from 'react-bootstrap';

const ClientsList = ({ searchQuery = '' }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    industry: '',
    status: '',
    location: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    industry: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const itemsPerPage = 10;

  // Fetch clients data
  useEffect(() => {
    fetchClients();
  }, [currentPage, filters, sortBy, sortOrder, searchQuery]);

  const fetchClients = async () => {
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

      const response = await fetch(`/api/v1/clients?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setClients(data.data || []);
      setTotalPages(data.meta?.total_pages || 1);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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


  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Handle adding new client
  const handleAddClient = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewClient({ name: '', industry: '' });
    setSubmitting(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingClient(null);
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingClient(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClient = (client) => {
    setEditingClient({ ...client });
    setShowEditModal(true);
  };

  const handleSubmitClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          client: newClient
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const data = await response.json();
      
      // Add the new client to the list
      setClients(prev => [data.data, ...prev]);
      
      // Close modal and reset form
      handleCloseModal();
      
      // Show success message (you could add a toast notification here)
      alert('Client created successfully!');
      
    } catch (err) {
      console.error('Error creating client:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/v1/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          client: {
            name: editingClient.name,
            industry: editingClient.industry
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      const data = await response.json();
      
      // Update the client in the list
      setClients(prev => prev.map(client => 
        client.id === editingClient.id ? data.data : client
      ));
      
      // Close modal and reset form
      handleCloseEditModal();
      
      // Show success message
      alert('Client updated successfully!');
      
    } catch (err) {
      console.error('Error updating client:', err);
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
              <p className="text-muted">Loading clients...</p>
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
              <Button variant="outline-danger" onClick={fetchClients}>
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
                  <h4 className="mb-0">Clients Directory</h4>
                  <small className="text-muted">
                    {clients.length} client{clients.length !== 1 ? 's' : ''} found
                  </small>
                </Col>
                <Col xs="auto">
                  <Button variant="primary" size="sm" onClick={handleAddClient}>
                    + Add Client
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Filters Section */}
              <div className="p-3 bg-light border-bottom">
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Industry</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.industry}
                        onChange={(e) => handleFilterChange('industry', e.target.value)}
                      >
                        <option value="">All Industries</option>
                        <option value="Technology">Technology</option>
                        <option value="Fintech">Fintech</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Manufacturing">Manufacturing</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Status</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">Location</Form.Label>
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="e.g. San Francisco, Remote"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Clients Table */}
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('name')}
                        className="border-0"
                      >
                        Client {getSortIcon('name')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('industry')}
                        className="border-0"
                      >
                        Industry {getSortIcon('industry')}
                      </th>
                      <th className="border-0">Active Opportunities</th>
                      <th className="border-0">Total Budget</th>
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
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <tr key={client.id}>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle me-3">
                                <div
                                  className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{ width: '40px', height: '40px', fontSize: '16px' }}
                                >
                                  {client.name.charAt(0)}
                                </div>
                              </div>
                              <div>
                                <div className="fw-semibold">{client.name}</div>
                                <div className="text-muted small">{client.industry}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg="light"
                              text="dark"
                              className="px-2 py-1 border"
                            >
                              {client.industry}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <span className="fw-medium me-2">{client.active_opportunities_count || 0}</span>
                              {client.active_opportunities_count > 0 && (
                                <Badge bg="success" className="px-2 py-1 small">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="fw-medium">
                              {client.total_budget ? `$${client.total_budget.toLocaleString()}` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-muted">
                              {new Date(client.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex gap-2">
                              <Button variant="outline-primary" size="sm">
                                View
                              </Button>
                              <Button 
                                variant="outline-warning" 
                                size="sm"
                                onClick={() => handleEditClient(client)}
                              >
                                Edit
                              </Button>
                              <Button variant="outline-secondary" size="sm">
                                Opportunities
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="text-muted">
                            <div className="mb-2" style={{ fontSize: '3rem' }}>🏢</div>
                            <h5>No Clients Found</h5>
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

      {/* Add Client Modal */}
      <Modal show={showAddModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitClient}>
            <Form.Group className="mb-3">
              <Form.Label>Client Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newClient.name}
                onChange={handleInputChange}
                placeholder="Enter client name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Industry *</Form.Label>
              <Form.Select
                name="industry"
                value={newClient.industry}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Fintech">Fintech</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Finance">Finance</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitClient}
            disabled={submitting || !newClient.name.trim() || !newClient.industry}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Create Client'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Client Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateClient}>
            <Form.Group className="mb-3">
              <Form.Label>Client Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editingClient?.name || ''}
                onChange={handleEditInputChange}
                placeholder="Enter client name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Industry *</Form.Label>
              <Form.Select
                name="industry"
                value={editingClient?.industry || ''}
                onChange={handleEditInputChange}
                required
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Fintech">Fintech</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Finance">Finance</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateClient}
            disabled={submitting || !editingClient?.name?.trim() || !editingClient?.industry}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Client'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClientsList;
