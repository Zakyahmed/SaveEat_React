// context/FoodContext.js - Version avec API
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import ApiService from '../services/api';
import { useAuth } from './AuthContext';

// Contexte de gestion des invendus et réservations
const FoodContext = createContext(null);

// Hook personnalisé pour utiliser le contexte
export const useFood = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood doit être utilisé dans un FoodProvider');
  }
  return context;
};

// Fournisseur du contexte
export const FoodProvider = ({ children }) => {
  // États principaux
  const [invendus, setInvendus] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Récupérer le contexte d'authentification
  const { authToken, user, userType } = useAuth();

  // Charger les données initiales
  useEffect(() => {
    if (authToken && user) {
      loadInitialData();
    }
  }, [authToken, user]);

  // Charger toutes les données nécessaires
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les données en parallèle pour optimiser
      const promises = [
        ApiService.getInvendus(),
        ApiService.getReservations()
      ];

      // Ajouter les restaurants/associations selon le type d'utilisateur
      if (userType === 'association') {
        promises.push(ApiService.getRestaurants());
      } else if (userType === 'restaurant') {
        promises.push(ApiService.getAssociations());
      }

      const results = await Promise.all(promises);

      // Mettre à jour les états
      setInvendus(results[0].data || []);
      setReservations(results[1].data || []);

      if (userType === 'association') {
        setRestaurants(results[2]?.data || []);
      } else if (userType === 'restaurant') {
        setAssociations(results[2]?.data || []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erreur de chargement des données', err);
      setError(err.message || 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
    }
  }, [userType]);

  // Rafraîchir les données
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Ajouter un nouvel invendu
  const addInvendu = useCallback(async (newInvendu) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.createInvendu(newInvendu);
      
      if (response.success && response.data) {
        // Ajouter le nouvel invendu à la liste locale
        setInvendus(prev => [response.data, ...prev]);
        return response.data;
      }
      
      throw new Error(response.message || 'Erreur lors de l\'ajout');
    } catch (err) {
      console.error('Erreur lors de l\'ajout d\'un invendu', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour un invendu existant
  const updateInvendu = useCallback(async (id, updates) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.updateInvendu(id, updates);
      
      if (response.success && response.data) {
        // Mettre à jour dans la liste locale
        setInvendus(prev => prev.map(inv => 
          inv.id === id ? response.data : inv
        ));
        return response.data;
      }
      
      throw new Error(response.message || 'Erreur lors de la mise à jour');
    } catch (err) {
      console.error('Erreur de mise à jour', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Supprimer un invendu
  const deleteInvendu = useCallback(async (id) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.deleteInvendu(id);
      
      if (response.success) {
        // Retirer de la liste locale
        setInvendus(prev => prev.filter(inv => inv.id !== id));
        return true;
      }
      
      throw new Error(response.message || 'Erreur lors de la suppression');
    } catch (err) {
      console.error('Erreur de suppression', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Réserver un invendu
  const reserveInvendu = useCallback(async (invenduId, userId) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.createReservation(invenduId);
      
      if (response.success && response.data) {
        // Ajouter la réservation à la liste locale
        setReservations(prev => [response.data, ...prev]);
        
        // Mettre à jour le statut de l'invendu
        setInvendus(prev => prev.map(inv => 
          inv.id === invenduId 
            ? { ...inv, status: 'reserved', reserved_by: userId }
            : inv
        ));
        
        return response.data;
      }
      
      throw new Error(response.message || 'Erreur lors de la réservation');
    } catch (err) {
      console.error('Erreur de réservation', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Annuler une réservation
  const cancelReservation = useCallback(async (reservationId) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.cancelReservation(reservationId);
      
      if (response.success) {
        // Trouver la réservation pour obtenir l'ID de l'invendu
        const reservation = reservations.find(r => r.id === reservationId);
        
        if (reservation) {
          // Mettre à jour le statut de l'invendu
          setInvendus(prev => prev.map(inv => 
            inv.id === reservation.invendu_id
              ? { ...inv, status: 'pending', reserved_by: null }
              : inv
          ));
        }
        
        // Retirer la réservation de la liste
        setReservations(prev => prev.filter(r => r.id !== reservationId));
        
        return true;
      }
      
      throw new Error(response.message || 'Erreur lors de l\'annulation');
    } catch (err) {
      console.error('Erreur d\'annulation', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [reservations]);

  // Mettre à jour une réservation
  const updateReservation = useCallback(async (id, updates) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.updateReservation(id, updates.status);
      
      if (response.success && response.data) {
        // Mettre à jour dans la liste locale
        setReservations(prev => prev.map(res => 
          res.id === id ? response.data : res
        ));
        
        // Si le statut est 'collected', mettre à jour l'invendu
        if (updates.status === 'collected') {
          const reservation = reservations.find(r => r.id === id);
          if (reservation) {
            setInvendus(prev => prev.map(inv => 
              inv.id === reservation.invendu_id
                ? { ...inv, status: 'completed' }
                : inv
            ));
          }
        }
        
        return response.data;
      }
      
      throw new Error(response.message || 'Erreur lors de la mise à jour');
    } catch (err) {
      console.error('Erreur de mise à jour de réservation', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [reservations]);

  // Récupérer les invendus disponibles
  const getAvailableInvendus = useCallback(() => {
    return invendus.filter(inv => inv.status === 'pending' || inv.status === 'available');
  }, [invendus]);

  // Récupérer les réservations actives d'un utilisateur
  const getUserReservations = useCallback((userId) => {
    return reservations.filter(r => 
      r.user_id === userId && 
      (r.status === 'active' || r.status === 'pending')
    );
  }, [reservations]);

  // Obtenir les statistiques du restaurant
  const getRestaurantStats = useCallback(async () => {
    try {
      const response = await ApiService.getStats();
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback avec calculs locaux
      const completedInvendus = invendus.filter(inv => 
        inv.restaurant_id === user?.id && inv.status === 'completed'
      );
      
      return {
        repasSauves: completedInvendus.length,
        associationsAidees: new Set(completedInvendus.map(inv => inv.reserved_by)).size,
        co2Economise: completedInvendus.length * 2.5 // Estimation
      };
    } catch (err) {
      console.error('Erreur lors de la récupération des stats', err);
      
      // Retourner des valeurs par défaut
      return {
        repasSauves: 0,
        associationsAidees: 0,
        co2Economise: 0
      };
    }
  }, [invendus, user]);

  // Rechercher des invendus avec filtres
  const searchInvendus = useCallback(async (filters) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.getInvendus(filters);
      
      if (response.success && response.data) {
        setInvendus(response.data);
        return response.data;
      }
      
      return [];
    } catch (err) {
      console.error('Erreur de recherche', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Valeur mémoïsée du contexte
  const contextValue = useMemo(() => ({
    // États
    invendus,
    reservations,
    restaurants,
    associations,
    isLoading,
    error,
    lastUpdate,

    // Méthodes
    addInvendu,
    updateInvendu,
    deleteInvendu,
    reserveInvendu,
    cancelReservation,
    updateReservation,
    getAvailableInvendus,
    getUserReservations,
    getRestaurantStats,
    searchInvendus,
    refreshData,
  }), [
    invendus,
    reservations,
    restaurants,
    associations,
    isLoading,
    error,
    lastUpdate,
    addInvendu,
    updateInvendu,
    deleteInvendu,
    reserveInvendu,
    cancelReservation,
    updateReservation,
    getAvailableInvendus,
    getUserReservations,
    getRestaurantStats,
    searchInvendus,
    refreshData
  ]);

  return (
    <FoodContext.Provider value={contextValue}>
      {children}
    </FoodContext.Provider>
  );
};

export default FoodProvider;