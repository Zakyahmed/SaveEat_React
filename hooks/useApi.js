// hooks/useApi.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authToken } = useAuth();
  
  // Fonction générique pour les appels API
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authToken]);
  
  // Méthodes spécifiques
  const get = useCallback((endpoint) => 
    apiCall(endpoint, { method: 'GET' }), 
    [apiCall]
  );
  
  const post = useCallback((endpoint, data) => 
    apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }), 
    [apiCall]
  );
  
  const put = useCallback((endpoint, data) => 
    apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }), 
    [apiCall]
  );
  
  const del = useCallback((endpoint) => 
    apiCall(endpoint, { method: 'DELETE' }), 
    [apiCall]
  );
  
  return { 
    loading, 
    error, 
    get, 
    post, 
    put, 
    delete: del 
  };
};