import React, { useState } from 'react';
import {
  Navbar,
  Nav,
  Form,
  Button,
  Badge,
  Dropdown
} from 'react-bootstrap';

const Header = ({ title, user, onSearch, onNotificationClick, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const notifications = [
    { id: 1, type: 'match', message: 'New match found for TechCorp React Developer', time: '2 min ago', unread: true },
    { id: 2, type: 'update', message: 'Sarah Chen updated her availability', time: '1 hour ago', unread: true },
    { id: 3, type: 'deadline', message: 'FinBank Python role deadline in 2 days', time: '3 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

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
                <Button variant="link" size="sm" className="p-0 text-primary">
                  Mark all read
                </Button>
              </Dropdown.Header>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map((notification) => (
                  <Dropdown.Item
                    key={notification.id}
                    className={`d-flex align-items-start p-3 ${notification.unread ? 'bg-light' : ''}`}
                  >
                    <div className="flex-grow-1">
                      <div className="small text-dark mb-1">
                        {notification.message}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {notification.time}
                      </div>
                    </div>
                    {notification.unread && (
                      <Badge bg="primary" className="rounded-circle p-1" style={{ width: '8px', height: '8px' }}>
                        <span className="visually-hidden">Unread</span>
                      </Badge>
                    )}
                  </Dropdown.Item>
                ))}
              </div>

              <Dropdown.Divider />
              <div className="text-center p-2">
                <Button variant="link" size="sm" className="text-primary">
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
