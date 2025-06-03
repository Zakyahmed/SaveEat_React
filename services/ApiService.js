// services/ApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode générique pour les requêtes
  async request(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('@saveeat:authToken');
      
      const config = {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Stocker le token si présent
    if (response.token) {
      await AsyncStorage.setItem('@saveeat:authToken', response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Stocker le token si présent
    if (response.token) {
      await AsyncStorage.setItem('@saveeat:authToken', response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      // Toujours supprimer le token local
      await AsyncStorage.removeItem('@saveeat:authToken');
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Invendus endpoints
  async getInvendus(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/invendus${queryString ? '?' + queryString : ''}`);
  }

  async createInvendu(data) {
    return this.request('/invendus', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateInvendu(id, data) {
    return this.request(`/invendus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteInvendu(id) {
    return this.request(`/invendus/${id}`, {
      method: 'DELETE'
    });
  }

  // Reservations endpoints
  async getReservations() {
    const userType = await AsyncStorage.getItem('@saveeat:userType');
    const endpoint = userType === 'restaurant' 
      ? '/reservations/restaurant' 
      : '/reservations/association';
    return this.request(endpoint);
  }

  async createReservation(invenduId) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify({ invendu_id: invenduId })
    });
  }

  async updateReservation(id, status) {
    return this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async cancelReservation(id) {
    return this.request(`/reservations/${id}`, {
      method: 'DELETE'
    });
  }

  // Restaurants endpoints
  async getRestaurants() {
    return this.request('/restaurants');
  }

  async getRestaurant(id) {
    return this.request(`/restaurants/${id}`);
  }

  // Associations endpoints
  async getAssociations() {
    return this.request('/search/associations');
  }

  // Stats endpoints
  async getStats() {
    const userType = await AsyncStorage.getItem('@saveeat:userType');
    if (userType === 'restaurant') {
      // Pour les restaurants, obtenir leurs propres stats
      const invendus = await this.request('/invendus/my');
      const reservations = await this.request('/reservations/restaurant');
      
      // Calculer les stats
      const completedReservations = reservations.data?.filter(r => r.status === 'completed') || [];
      return {
        success: true,
        data: {
          repasSauves: completedReservations.length,
          associationsAidees: new Set(completedReservations.map(r => r.association_id)).size,
          co2Economise: completedReservations.length * 2.5
        }
      };
    }
    
    // Pour les autres types, stats générales
    return this.request('/stats/general');
  }

  // Justificatifs endpoints
  async getJustificatifs() {
    return this.request('/justificatifs');
  }

  async getJustificatifStatus() {
    return this.request('/justificatifs/status');
  }

  // Upload file pour justificatifs
  async uploadFile(fileUri, type, additionalData = {}) {
    try {
      const token = await AsyncStorage.getItem('@saveeat:authToken');
      
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: 'justificatif.jpg'
      });
      
      // Ajouter le type de justificatif
      formData.append('type', type);
      
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const response = await fetch(`${this.baseURL}/justificatifs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur upload');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

export default new ApiService();