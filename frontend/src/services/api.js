// src/services/api.js

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * A helper object for making API calls.
 * It automatically adds the Authorization header with the JWT token from localStorage.
 */
const api = {
  get: (path) => fetch(`${API_BASE_URL}${path}`, { 
    headers: { 'x-auth-token': localStorage.getItem('token') } 
  }),
  
  post: (path, data) => fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  }),
  
  put: (path, data) => fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  }),
  
  delete: (path) => fetch(`${API_BASE_URL}${path}`, { 
    method: 'DELETE',
    headers: { 'x-auth-token': localStorage.getItem('token') }
  }),
};

export default api;
