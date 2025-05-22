import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from './useAuth'; // Hook pour gérer l'authentification

const API_URL = 'https://api.saveeat.ch/api'; // À adapter selon votre environnement

export const useJustificatifs = () => {
  const [justificatifs, setJustificatifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { authToken } = useAuth(); // Récupération du token d'authentification
  
  // Configuration de l'en-tête d'autorisation
  const axiosConfig = useCallback(() => {
    return {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };
  }, [authToken]);
  
  // Récupération des justificatifs depuis l'API
  const fetchJustificatifs = useCallback(async () => {
    if (!authToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/justificatifs/status`, axiosConfig());
      setJustificatifs(response.data.justificatifs || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des justificatifs:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la récupération des justificatifs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, axiosConfig]);
  
  // Rafraîchissement des données
  const refreshJustificatifs = useCallback(() => {
    setRefreshing(true);
    fetchJustificatifs();
  }, [fetchJustificatifs]);
  
  // Envoi d'un nouveau justificatif
  const uploadJustificatif = async (fileUri, type, commentaire = '') => {
    if (!authToken) {
      Alert.alert('Erreur', 'Vous devez être connecté pour envoyer un justificatif');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Créer un objet FormData pour l'upload de fichier
      const formData = new FormData();
      
      // Extraire le nom du fichier de l'URI
      const fileName = fileUri.split('/').pop();
      
      // Détecter le type MIME
      let fileType = 'application/pdf';
      if (/\.(jpg|jpeg)$/i.test(fileName)) {
        fileType = 'image/jpeg';
      } else if (/\.png$/i.test(fileName)) {
        fileType = 'image/png';
      }
      
      // Ajouter le fichier
      formData.append('fichier', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      
      // Ajouter les autres paramètres
      formData.append('type', type);
      if (commentaire) {
        formData.append('commentaire', commentaire);
      }
      
      const uploadConfig = {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        }
      };
      
      const response = await axios.post(`${API_URL}/justificatifs`, formData, uploadConfig);
      
      // Rafraîchir la liste après l'upload
      fetchJustificatifs();
      
      return response.data.justificatif;
    } catch (err) {
      console.error('Erreur lors de l\'envoi du justificatif:', err);
      const errorMsg = err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi du justificatif';
      setError(errorMsg);
      Alert.alert('Erreur', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Suppression d'un justificatif
  const deleteJustificatif = async (justificatifId) => {
    if (!authToken) {
      Alert.alert('Erreur', 'Vous devez être connecté pour supprimer un justificatif');
      return false;
    }
    
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/justificatifs/${justificatifId}`, axiosConfig());
      
      // Mettre à jour la liste des justificatifs après suppression
      setJustificatifs(current => current.filter(j => j.id !== justificatifId));
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du justificatif:', err);
      const errorMsg = err.response?.data?.message || 'Une erreur est survenue lors de la suppression';
      setError(errorMsg);
      Alert.alert('Erreur', errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les justificatifs au montage du composant
  useEffect(() => {
    if (authToken) {
      fetchJustificatifs();
    }
  }, [fetchJustificatifs, authToken]);
  
  return {
    justificatifs,
    loading,
    error,
    refreshing,
    refreshJustificatifs,
    uploadJustificatif,
    deleteJustificatif,
  };
};