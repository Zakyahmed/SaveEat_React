class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode pour obtenir les headers avec le token
  async getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Méthode générique pour les requêtes
  async request(endpoint, options = {}) {
    try {
      const headers = await this.getHeaders(options.includeAuth !== false);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Si la réponse n'est pas OK, parser l'erreur
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      // Parser la réponse JSON
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  // Méthodes d'authentification
  async login(email, password) {
    const data = await this.request('/login', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, password }),
    });

    // Stocker le token
    if (data.token) {
      await AsyncStorage.setItem('authToken', data.token);
    }

    return data;
  }

  async register(userData) {
    const data = await this.request('/register', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify(userData),
    });

    // Stocker le token si fourni
    if (data.token) {
      await AsyncStorage.setItem('authToken', data.token);
    }

    return data;
  }

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } catch (error) {
      console.log('Erreur logout API:', error);
    }
    
    // Supprimer le token local dans tous les cas
    await AsyncStorage.removeItem('authToken');
  }

  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(data) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Méthodes pour les invendus
  async getInvendus(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/invendus?${queryString}`);
  }

  async getInvendu(id) {
    return this.request(`/invendus/${id}`);
  }

  async createInvendu(data) {
    return this.request('/invendus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvendu(id, data) {
    return this.request(`/invendus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvendu(id) {
    return this.request(`/invendus/${id}`, {
      method: 'DELETE',
    });
  }

  // Méthodes pour les réservations
  async getReservations() {
    return this.request('/reservations');
  }

  async createReservation(invenduId) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify({ invendu_id: invenduId }),
    });
  }

  async updateReservation(id, status) {
    return this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async cancelReservation(id) {
    return this.request(`/reservations/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Méthodes pour les restaurants et associations
  async getRestaurants() {
    return this.request('/restaurants');
  }

  async getAssociations() {
    return this.request('/associations');
  }

  // Statistiques
  async getStats() {
    return this.request('/stats');
  }

  // Upload de fichiers (pour les justificatifs)
  async uploadFile(uri, type, additionalData = {}) {
    const formData = new FormData();
    
    // Ajouter le fichier
    formData.append('file', {
      uri,
      type: 'image/jpeg', // ou 'application/pdf'
      name: 'upload.jpg',
    });

    // Ajouter les données supplémentaires
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur upload: ${response.status}`);
    }

    return response.json();
  }
}

// Exporter une instance unique
export default new ApiService();