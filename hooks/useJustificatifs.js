// hooks/useJustificatifs.js - Version avec ApiService
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useJustificatifs = () => {
  // États
  const [justificatifs, setJustificatifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Récupération du contexte Auth
  const { authToken } = useAuth();
  
  // Fonction asynchrone pour récupérer les justificatifs
  const fetchJustificatifs = useCallback(async () => {
    if (!authToken) {
      console.log('Pas de token disponible');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser ApiService
      const response = await ApiService.request('/justificatifs', {
        method: 'GET'
      });
      
      // Mise à jour de l'état
      setJustificatifs(response.data || []);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des justificatifs:', err);
      setError(err.message || 'Une erreur est survenue');
      
      // Ne pas afficher d'alerte si c'est juste un rafraîchissement
      if (!refreshing) {
        Alert.alert(
          'Erreur', 
          'Impossible de récupérer les justificatifs',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, refreshing]);
  
  // Fonction pour rafraîchir les données
  const refreshJustificatifs = useCallback(() => {
    setRefreshing(true);
    fetchJustificatifs();
  }, [fetchJustificatifs]);
  
  // Fonction asynchrone pour uploader un justificatif
  const uploadJustificatif = async (fileUri, type, commentaire = '') => {
    if (!authToken) {
      Alert.alert('Erreur', 'Vous devez être connecté pour envoyer un justificatif');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser la méthode d'upload d'ApiService
      const response = await ApiService.uploadFile(fileUri, type, {
        type_justificatif: type,
        commentaire: commentaire
      });
      
      if (response.success && response.data) {
        // Rafraîchir la liste après l'upload
        await fetchJustificatifs();
        
        Alert.alert(
          'Succès',
          'Votre justificatif a été envoyé avec succès',
          [{ text: 'OK' }]
        );
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'envoi');
      }
      
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      setError(err.message);
      
      Alert.alert(
        'Erreur d\'envoi',
        err.message || 'Une erreur est survenue lors de l\'envoi du fichier',
        [{ text: 'OK' }]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction asynchrone pour supprimer un justificatif
  const deleteJustificatif = useCallback(async (justificatifId) => {
    if (!authToken) {
      Alert.alert('Erreur', 'Vous devez être connecté pour supprimer un justificatif');
      return false;
    }
    
    try {
      setLoading(true);
      
      // Appel API pour supprimer
      const response = await ApiService.request(`/justificatifs/${justificatifId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Mise à jour immutable : filtrer le justificatif supprimé
        setJustificatifs(current => 
          current.filter(j => j.id !== justificatifId)
        );
        
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
      
    } catch (err) {
      console.error('Erreur:', err);
      Alert.alert('Erreur', 'Impossible de supprimer le justificatif');
      return false;
    } finally {
      setLoading(false);
    }
  }, [authToken]);
  
  // useEffect pour charger les justificatifs au montage
  useEffect(() => {
    if (authToken) {
      console.log('Token disponible, chargement des justificatifs...');
      fetchJustificatifs();
    }
  }, [authToken, fetchJustificatifs]);
  
  // Retourner les valeurs et fonctions du hook
  return {
    justificatifs,
    loading,
    error,
    refreshing,
    refreshJustificatifs,
    uploadJustificatif,
    deleteJustificatif,
    refetch: fetchJustificatifs
  };
};