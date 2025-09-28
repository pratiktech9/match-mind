import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Form,
  Button,
  Badge,
  Dropdown
} from 'react-bootstrap';

const Header = ({ title, user, onSearch, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };


  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/v1/notifications?per_page=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.meta?.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
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

  useEffect(() => {
    fetchNotifications();
        // Refresh notifications every 30 seconds
        const interval = window.setInterval(fetchNotifications, 30000);
        return () => window.clearInterval(interval);
  }, []);

  return (
    <Navbar bg="white" className="border-bottom shadow-sm sticky-top">
      <div className="w-100 d-flex justify-content-between align-items-center px-4 py-2">
        {/* Page Title */}
        <Navbar.Brand className="mb-0 flex-shrink-0">
          <h1 className="mb-0 h4 fw-semibold text-dark">{title}</h1>
        </Navbar.Brand>

        {/* Header Actions */}
        <div className="d-flex align-items-center flex-shrink-0">
          {/* Search */}
          <Form className="me-3 d-none d-md-block" onSubmit={handleSearchSubmit}>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pe-5"
                style={{ width: '250px' }}
              />
              <Button
                type="submit"
                variant="link"
                className="position-absolute end-0 top-50 translate-middle-y border-0 p-2"
                style={{ zIndex: 10 }}
              >
                🔍
              </Button>
            </div>
          </Form>

          {/* Mobile Search Button */}
          <Button
            variant="link"
            className="me-3 d-md-none p-2 text-decoration-none"
          >
            🔍
          </Button>

          {/* Notifications Dropdown */}
          <Dropdown className="me-3" align="end">
            <Dropdown.Toggle
              variant="link"
              className="position-relative p-2 border-0 text-decoration-none"
              id="notifications-dropdown"
            >
              🔔
              {unreadCount > 0 && (
                <Badge
                  bg="danger"
                  className="position-absolute top-0 end-0 rounded-pill"
                  style={{ fontSize: '0.75rem' }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: '350px', minWidth: '320px' }}>
              <Dropdown.Header className="d-flex justify-content-between align-items-center">
                <strong>Notifications</strong>
                {unreadCount > 0 && (
                  <Button variant="link" size="sm" className="p-0 text-primary" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </Dropdown.Header>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Dropdown.Item
                      key={notification.id}
                      className={`d-flex align-items-start p-3 ${notification.status === 'unread' ? 'bg-light' : ''}`}
                      onClick={() => notification.status === 'unread' && markAsRead(notification.id)}
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <span className="me-2">{notification.icon}</span>
                          <div className="small text-dark fw-semibold">
                            {notification.title}
                          </div>
                        </div>
                        <div className="small text-muted mb-1">
                          {notification.message}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {notification.time_ago}
                          </div>
                          <Badge bg={notification.priority_color} size="sm">
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      {notification.status === 'unread' && (
                        <div className="ms-2">
                          <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                        </div>
                      )}
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item className="text-center text-muted p-3">
                    No notifications
                  </Dropdown.Item>
                )}
              </div>

              <Dropdown.Divider />
              <div className="text-center p-2">
                <Button variant="link" size="sm" className="text-primary" onClick={() => window.onNavigate && window.onNavigate('notifications')}>
                  View all notifications
                </Button>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          {/* User Menu Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              className="d-flex align-items-center text-decoration-none border-0 p-2"
              id="user-dropdown"
            >
              <div className="d-flex align-items-center">
                <div className="me-2 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                     style={{ width: '32px', height: '32px' }}>
                  {user?.image_url ? (
                    <img
                      src={user.image_url}
                      alt={user.name}
                      className="w-100 h-100 rounded-circle"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="fw-semibold small">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  )}
                </div>
                <div className="text-start d-none d-lg-block">
                  <div className="small fw-medium text-dark">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {user?.role || 'Member'}
                  </div>
                </div>
                <span className="ms-2 text-muted small d-none d-md-inline">▼</span>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: '280px', minWidth: '250px' }}>
              <div className="d-flex align-items-center p-3 border-bottom">
                <div className="me-3 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                     style={{ width: '48px', height: '48px' }}>
                  {user?.image_url ? (
                    <img
                      src={user.image_url}
                      alt={user.name}
                      className="w-100 h-100 rounded-circle"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="fw-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="fw-semibold text-dark mb-1">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-muted small">
                    {user?.email || ''}
                  </div>
                </div>
              </div>

              <Dropdown.Item className="d-flex align-items-center py-2">
                <span className="me-3">👤</span>
                Profile Settings
              </Dropdown.Item>
              <Dropdown.Item className="d-flex align-items-center py-2">
                <span className="me-3">⚙️</span>
                Preferences
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                className="d-flex align-items-center py-2 text-danger"
                onClick={onLogout}
              >
                <span className="me-3">🚪</span>
                Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </Navbar>
  );
};

export default Header;
