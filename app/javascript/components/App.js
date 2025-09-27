import React, { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [showToast, setShowToast] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  ]

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const showToastMessage = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Check authentication status on component mount
  useEffect(() => {
    fetch('/api/current_user')
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error checking auth status:', error)
        setIsLoading(false)
      })
  }, [])

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google_oauth2'
  }

  const handleLogout = () => {
    fetch('/logout', {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      }
    })
    .then(() => {
      setUser(null)
      window.location.href = '/'
    })
    .catch(error => {
      console.error('Logout error:', error)
    })
  }

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <a className="navbar-brand" href="#home">Match Mind</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <a className="nav-link" href="#home">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>
            </ul>
            <ul className="navbar-nav">
              {user ? (
                <>
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                      <img src={user.image_url} alt={user.name} className="rounded-circle me-2" width="24" height="24" />
                      {user.name}
                    </a>
                    <ul className="dropdown-menu">
                      <li><a className="dropdown-item" href="#">Profile</a></li>
                      <li><a className="dropdown-item" href="#">Settings</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                    </ul>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <button 
                    className="btn btn-outline-light btn-sm"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Sign in with Google'}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        {/* Hero Section */}
        <div className="row mb-5">
          <div className="col">
            <div className="card text-center bg-primary text-white">
              <div className="card-body py-5">
                <h1 className="display-4">Welcome to Match Mind</h1>
                <p className="lead">
                  {user 
                    ? `Hello ${user.name}! Welcome to your internal application.`
                    : 'A comprehensive React application with modern UI components'
                  }
                </p>
                {user ? (
                  <div className="btn-group">
                    <button
                      className="btn btn-light btn-lg"
                      onClick={() => setShowModal(true)}
                    >
                      Get Started
                    </button>
                    <button className="btn btn-outline-light btn-lg">
                      Learn More
                    </button>
                  </div>
                ) : (
                  <div className="btn-group">
                    <button
                      className="btn btn-light btn-lg"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Sign in with Google'}
                    </button>
                    <button className="btn btn-outline-light btn-lg">
                      Learn More
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="row mb-4">
          <div className="col">
            <ul className="nav nav-tabs mb-3" id="myTab" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  Home
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'data' ? 'active' : ''}`}
                  onClick={() => setActiveTab('data')}
                >
                  Data Table
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'components' ? 'active' : ''}`}
                  onClick={() => setActiveTab('components')}
                >
                  Components
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {activeTab === 'home' && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5>Search & Filter</h5>
                      </div>
                      <div className="card-body">
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearch}
                          />
                          <button className="btn btn-outline-secondary" type="button">
                            <i className="bi bi-search"></i>
                          </button>
                        </div>
                        <div className="alert alert-info">
                          Search term: <strong>{searchTerm || 'None'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5>Progress & Status</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label">Loading Progress</label>
                          <div className="progress">
                            <div
                              className="progress-bar"
                              style={{ width: `${(count * 10) % 100}%` }}
                            >
                              {(count * 10) % 100}%
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className="badge bg-success me-2">Active</span>
                          <span className="badge bg-warning me-2">Pending</span>
                          <span className="badge bg-danger">Error</span>
                        </div>
                        <button
                          className="btn btn-success"
                          onClick={showToastMessage}
                        >
                          Show Toast Notification
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="card">
                  <div className="card-header">
                    <h5>Sample Data Table</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.map((item) => (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>{item.name}</td>
                              <td>{item.email}</td>
                              <td>
                                <span className={`badge ${item.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>
                                <div className="dropdown">
                                  <button
                                    className="btn btn-outline-primary btn-sm dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                  >
                                    Actions
                                  </button>
                                  <ul className="dropdown-menu">
                                    <li><a className="dropdown-item" href="#">Edit</a></li>
                                    <li><a className="dropdown-item" href="#">Delete</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href="#">View Details</a></li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-center">
                      <nav>
                        <ul className="pagination">
                          <li className="page-item">
                            <a className="page-link" href="#" aria-label="Previous">
                              <span aria-hidden="true">&laquo;</span>
                            </a>
                          </li>
                          <li className="page-item active">
                            <a className="page-link" href="#">1</a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#">2</a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#">3</a>
                          </li>
                          <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next">
                              <span aria-hidden="true">&raquo;</span>
                            </a>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'components' && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-4">
                      <div className="card-header">
                        <h5>Form Components</h5>
                      </div>
                      <div className="card-body">
                        <form>
                          <div className="mb-3">
                            <label className="form-label">Email address</label>
                            <input type="email" className="form-control" placeholder="Enter email" />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-control" placeholder="Password" />
                          </div>
                          <div className="mb-3 form-check">
                            <input type="checkbox" className="form-check-input" id="rememberMe" />
                            <label className="form-check-label" htmlFor="rememberMe">
                              Remember me
                            </label>
                          </div>
                          <button type="submit" className="btn btn-primary">Submit</button>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card mb-4">
                      <div className="card-header">
                        <h5>Accordion</h5>
                      </div>
                      <div className="card-body">
                        <div className="accordion" id="accordionExample">
                          <div className="accordion-item">
                            <h2 className="accordion-header" id="headingOne">
                              <button
                                className="accordion-button"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseOne"
                              >
                                What is React?
                              </button>
                            </h2>
                            <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#accordionExample">
                              <div className="accordion-body">
                                React is a JavaScript library for building user interfaces, particularly web applications.
                              </div>
                            </div>
                          </div>
                          <div className="accordion-item">
                            <h2 className="accordion-header" id="headingTwo">
                              <button
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseTwo"
                              >
                                What is Bootstrap?
                              </button>
                            </h2>
                            <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                              <div className="accordion-body">
                                Bootstrap is a free and open-source CSS framework directed at responsive, mobile-first front-end web development.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counter Section */}
        <div className="row mb-4">
          <div className="col">
            <div className="card text-center">
              <div className="card-body">
                <h2 className="card-title">Interactive Counter</h2>
                <p className="lead">Count: {count}</p>
                <div className="btn-group">
                  <button
                    className="btn btn-primary"
                    onClick={() => setCount(count + 1)}
                  >
                    Increment
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCount(count - 1)}
                  >
                    Decrement
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => setCount(0)}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Welcome to Match Mind!</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>This is a comprehensive React application built with JSX and Bootstrap components.</p>
                <p>Features include:</p>
                <ul>
                  <li>Search and pagination</li>
                  <li>Data tables with actions</li>
                  <li>Forms and validation</li>
                  <li>Modals and alerts</li>
                  <li>Navigation and tabs</li>
                  <li>Progress indicators</li>
                  <li>JSX support with Babel</li>
                  <li>And much more!</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className="toast-container position-fixed top-0 end-0 p-3">
          <div className="toast show" role="alert">
            <div className="toast-header">
              <strong className="me-auto">Notification</strong>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowToast(false)}
              ></button>
            </div>
            <div className="toast-body">
              This is a toast notification example!
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showModal && <div className="modal-backdrop show"></div>}
    </div>
  )
}

export default App
