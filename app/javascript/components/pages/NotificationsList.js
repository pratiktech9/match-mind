import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  Spinner,
  Alert,
  Dropdown,
  Pagination
} from 'react-bootstrap';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    notification_type: ''
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        ...filters
      });

      const response = await fetch(`/api/v1/notifications?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.data || []);
      setTotalPages(data.meta?.total_pages || 1);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/mark_read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
      });
      if (response.ok) {
        fetchNotifications(); // Refresh notifications
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/notifications/mark_all_read', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
      });
      if (response.ok) {
        fetchNotifications(); // Refresh notifications
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
      });
      if (response.ok) {
        fetchNotifications(); // Refresh notifications
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'rolling_off_soon': return '🗓️';
      case 'potential_match': return '🎯';
      case 'new_opportunity': return '✨';
      case 'skill_gap': return '⚠️';
      case 'budget_mismatch': return '💰';
      case 'availability_change': return '🔄';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Notifications</h2>
              <p className="text-muted mb-0">
                {notifications.length} notifications found
              </p>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={markAllAsRead}
                className="me-2"
              >
                Mark All Read
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => fetch('/api/v1/notifications/generate_insights', { method: 'POST' })}
              >
                Generate Insights
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="archived">Archived</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Priority</Form.Label>
                    <Form.Select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={filters.notification_type}
                      onChange={(e) => handleFilterChange('notification_type', e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="rolling_off_soon">Rolling Off Soon</option>
                      <option value="potential_match">Potential Match</option>
                      <option value="new_opportunity">New Opportunity</option>
                      <option value="skill_gap">Skill Gap</option>
                      <option value="budget_mismatch">Budget Mismatch</option>
                      <option value="availability_change">Availability Change</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setFilters({ status: '', priority: '', notification_type: '' })}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <div className="text-muted">
                  <h4>No notifications found</h4>
                  <p>Try adjusting your filters or generate new insights.</p>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`mb-3 ${notification.status === 'unread' ? 'border-primary' : ''}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <span className="me-2 fs-4">{getNotificationIcon(notification.notification_type)}</span>
                          <h5 className="mb-0 me-2">{notification.title}</h5>
                          <Badge bg={getPriorityColor(notification.priority)} className="me-2">
                            {notification.priority}
                          </Badge>
                          {notification.status === 'unread' && (
                            <Badge bg="primary">New</Badge>
                          )}
                        </div>
                        <p className="text-muted mb-2">{notification.message}</p>
                        <div className="d-flex align-items-center text-muted small">
                          <span>{notification.time_ago}</span>
                          <span className="mx-2">•</span>
                          <span className="text-capitalize">{notification.notification_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="ms-3">
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {notification.status === 'unread' && (
                              <Dropdown.Item onClick={() => markAsRead(notification.id)}>
                                Mark as Read
                              </Dropdown.Item>
                            )}
                            <Dropdown.Item onClick={() => archiveNotification(notification.id)}>
                              Archive
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NotificationsList;
