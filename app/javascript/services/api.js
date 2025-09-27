// API service for making HTTP requests
class ApiService {
  constructor() {
    this.baseURL = '/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  // Get CSRF token from meta tag
  getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : null;
  }

  // Build headers with CSRF token
  getHeaders(additionalHeaders = {}) {
    const csrfToken = this.getCSRFToken();
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        if (Array.isArray(params[key])) {
          params[key].forEach(value => url.searchParams.append(`${key}[]`, value));
        } else {
          url.searchParams.append(key, params[key]);
        }
      }
    });

    return this.request(url.pathname + url.search);
  }

  // POST request
  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // PATCH request
  patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// Engineers API methods
export class EngineersAPI {
  constructor() {
    this.api = new ApiService();
  }

  // Get all engineers with optional filters
  getEngineers(params = {}) {
    return this.api.get('/engineers', params);
  }

  // Get a single engineer
  getEngineer(id) {
    return this.api.get(`/engineers/${id}`);
  }

  // Create a new engineer
  createEngineer(engineerData) {
    return this.api.post('/engineers', { engineer: engineerData });
  }

  // Update an engineer
  updateEngineer(id, engineerData) {
    return this.api.patch(`/engineers/${id}`, { engineer: engineerData });
  }

  // Delete an engineer
  deleteEngineer(id) {
    return this.api.delete(`/engineers/${id}`);
  }

  // Search engineers
  searchEngineers(query, filters = {}) {
    return this.api.get('/engineers', { search: query, ...filters });
  }
}

// Create a singleton instance
export const engineersAPI = new EngineersAPI();

export default ApiService;
