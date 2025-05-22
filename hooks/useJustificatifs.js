import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';

// IMPORTANT : Remplacez X par l'IP de votre machine
const API_URL = 'http://192.168.1.X:8888/api'; // PAS de https://, juste http://

export const useJustificatifs = () => {
  const [justificatifs, setJustificatifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { authToken } = useAuth();
  
  // Configuration de l'en-tête d'autorisation pour les requêtes normales
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
      const response = await fetch(`${API_URL}/justificatifs/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        }
      });
      
      const data = await response.json();
      setJustificatifs(data.justificatifs || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des justificatifs:', err);
      setError('Une erreur est survenue lors de la récupération des justificatifs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);
  
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
      // Déterminer le type MIME
      const fileName = fileUri.split('/').pop();
      let mimeType = 'application/pdf';
      if (/\.(jpg|jpeg)$/i.test(fileName)) {
        mimeType = 'image/jpeg';
      } else if (/\.png$/i.test(fileName)) {
        mimeType = 'image/png';
      }
      
      console.log('Upload URL:', `${API_URL}/justificatifs`);
      console.log('File URI:', fileUri);
      console.log('Auth Token:', authToken ? 'Present' : 'Missing');
      
      const uploadResult = await FileSystem.uploadAsync(
        `${API_URL}/justificatifs`,
        fileUri,
        {
          fieldName: 'fichier',
          httpMethod: 'POST',
          mimeType: mimeType,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
          },
          parameters: {
            type: type,
            commentaire: commentaire || ''
          },
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        }
      );
      
      console.log('Upload response status:', uploadResult.status);
      console.log('Upload response body:', uploadResult.body);
      
      if (uploadResult.status === 200 || uploadResult.status === 201) {
        const result = JSON.parse(uploadResult.body);
        fetchJustificatifs();
        return result.justificatif;
      } else {
        throw new Error(`Erreur upload: ${uploadResult.status}`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi du justificatif:', err);
      setError('Une erreur est survenue lors de l\'envoi');
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du fichier');
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
      const response = await fetch(`${API_URL}/justificatifs/${justificatifId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        // Mettre à jour la liste des justificatifs après suppression
        setJustificatifs(current => current.filter(j => j.id !== justificatifId));
        return true;
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du justificatif:', err);
      setError('Une erreur est survenue lors de la suppression');
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
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