// context/AuthContext.js - Version avec API
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

// Création du contexte
const AuthContext = createContext(null);

// Clés pour le stockage
const STORAGE_KEYS = {
  USER: '@saveeat:user',
  USER_TYPE: '@saveeat:userType',
  AUTH_TOKEN: '@saveeat:authToken'
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Fournisseur du contexte d'authentification
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger l'utilisateur depuis le stockage local au démarrage 
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Charger les données en parallèle
        const [storedUser, storedUserType, storedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        ]);
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setAuthToken(storedToken);
          
          if (storedUserType) {
            setUserType(storedUserType);
          }
          
          // Vérifier si le token est toujours valide en récupérant le profil
          try {
            const profileData = await ApiService.getProfile();
            setUser(profileData.user);
            
            // Sauvegarder les données mises à jour
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profileData.user));
          } catch (error) {
            console.log('Token invalide, déconnexion...');
            // Token invalide, nettoyer
            await logout();
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadUser();
  }, []);

  // Fonction de connexion avec l'API
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      
      // Appel API
      const response = await ApiService.login(email, password);
      
      if (response.success && response.user && response.token) {
        // Stocker les données
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user)),
          AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token),
          AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, response.user.type || '')
        ]);
        
        setUser(response.user);
        setAuthToken(response.token);
        setUserType(response.user.type);
        
        return { success: true, user: response.user };
      }
      
      return { 
        success: false, 
        error: response.message || 'Identifiants invalides' 
      };
    } catch (error) {
      console.error('Erreur lors de la connexion', error);
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion au serveur' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction d'inscription avec l'API
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      
      // Appel API
      const response = await ApiService.register(userData);
      
      if (response.success && response.user) {
        // Si un token est fourni, connecter directement l'utilisateur
        if (response.token) {
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user)),
            AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token)
          ]);
          
          setUser(response.user);
          setAuthToken(response.token);
        }
        
        return { success: true, user: response.user };
      }
      
      return { 
        success: false, 
        error: response.message || 'Impossible de créer le compte' 
      };
    } catch (error) {
      console.error('Erreur lors de l\'inscription', error);
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion au serveur' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour définir le type d'utilisateur 
  const setUserRole = useCallback(async (type) => {
    try {
      // Sauvegarder localement
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, type);
      setUserType(type);
      
      // Si l'utilisateur est connecté, mettre à jour sur le serveur
      if (user && authToken) {
        try {
          await ApiService.updateProfile({ type });
          
          // Mettre à jour l'utilisateur local
          const updatedUser = { ...user, type };
          setUser(updatedUser);
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        } catch (error) {
          console.error('Erreur lors de la mise à jour du type sur le serveur', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la définition du type d\'utilisateur', error);
      return { 
        success: false, 
        error: 'Impossible de définir le type d\'utilisateur' 
      };
    }
  }, [user, authToken]);

  // Fonction de déconnexion 
  const logout = useCallback(async () => {
    try {
      // Appel API pour invalider le token côté serveur
      if (authToken) {
        try {
          await ApiService.logout();
        } catch (error) {
          console.log('Erreur lors de la déconnexion côté serveur', error);
        }
      }
      
      // Nettoyer le stockage local
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER, 
        STORAGE_KEYS.USER_TYPE,
        STORAGE_KEYS.AUTH_TOKEN
      ]);
      
      setUser(null);
      setUserType(null);
      setAuthToken(null);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
      return { 
        success: false, 
        error: 'Impossible de déconnecter l\'utilisateur' 
      };
    }
  }, [authToken]);

  // Fonction pour mettre à jour le profil
  const updateUserProfile = useCallback(async (updates) => {
    try {
      setIsLoading(true);
      
      const response = await ApiService.updateProfile(updates);
      
      if (response.success && response.user) {
        setUser(response.user);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        
        return { success: true, user: response.user };
      }
      
      return { 
        success: false, 
        error: response.message || 'Impossible de mettre à jour le profil' 
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil', error);
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion au serveur' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Valeur à fournir au contexte 
  const value = useMemo(() => ({
    user,
    userType,
    authToken,
    isLoading,
    isInitialized,
    login,
    logout,
    register,
    setUserRole,
    updateUserProfile
  }), [user, userType, authToken, isLoading, isInitialized, login, logout, register, setUserRole, updateUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;