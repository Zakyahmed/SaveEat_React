// ecrans/EcranSelectionProfil.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import Button from '../composants/Button';
import Logo from '../composants/Logo';
import { useAuth } from '../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const EcranSelectionProfil = ({ navigation }) => {
  // États
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Contexte d'authentification
  const { setUserRole } = useAuth();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const restaurantScale = useRef(new Animated.Value(1)).current;
  const associationScale = useRef(new Animated.Value(1)).current;
  
  // Animation au chargement
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Animation de pression sur une carte
  const animatePressIn = (animValue) => {
    Animated.spring(animValue, {
      toValue: 0.95,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  
  const animatePressOut = (animValue) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  
  // Gestionnaire de sélection de restaurant
  const handleSelectRestaurant = async () => {
    setSelectedRole('restaurant');
    setIsLoading(true);
    
    try {
      const result = await setUserRole('restaurant');
      
      if (result.success) {
        // Navigation avec animation de sortie
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          navigation.navigate('EcranVerificationProfil', { 
            userType: 'restaurant' 
          });
        });
      } else {
        Alert.alert(
          'Erreur', 
          result.error || 'Impossible de définir le profil',
          [{ text: 'OK' }]
        );
        setSelectedRole(null);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du profil:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue',
        [{ text: 'OK' }]
      );
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestionnaire de sélection d'association
  const handleSelectAssociation = async () => {
    setSelectedRole('association');
    setIsLoading(true);
    
    try {
      const result = await setUserRole('association');
      
      if (result.success) {
        // Navigation avec animation de sortie
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          navigation.navigate('EcranVerificationProfil', { 
            userType: 'association' 
          });
        });
      } else {
        Alert.alert(
          'Erreur', 
          result.error || 'Impossible de définir le profil',
          [{ text: 'OK' }]
        );
        setSelectedRole(null);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du profil:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue',
        [{ text: 'OK' }]
      );
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.beige }]}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        {/* Logo animé */}
        <View style={styles.logoWrapper}>
          <Logo size="large" />
        </View>
        
        {/* Titre et description */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Choisissez votre profil</Text>
          <Text style={styles.description}>
            <Text style={styles.highlightText}>Réduisons le gaspillage</Text>{'\n'}
            Connectez restaurants et associations{'\n'}
            pour un impact positif
          </Text>
        </View>
        
        {/* Cartes de sélection */}
        <View style={styles.cardsContainer}>
          {/* Carte Restaurant */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => animatePressIn(restaurantScale)}
            onPressOut={() => animatePressOut(restaurantScale)}
            onPress={handleSelectRestaurant}
            disabled={isLoading}
          >
            <Animated.View 
              style={[
                styles.roleCard,
                selectedRole === 'restaurant' && styles.selectedCard,
                { transform: [{ scale: restaurantScale }] }
              ]}
            >
              <View style={styles.iconContainer}>
                <FontAwesome5 
                  name="utensils" 
                  size={40} 
                  color={selectedRole === 'restaurant' ? 'white' : colors.green} 
                />
              </View>
              <Text style={[
                styles.roleTitle,
                selectedRole === 'restaurant' && styles.selectedText
              ]}>
                Je suis un restaurant
              </Text>
              <Text style={[
                styles.roleDescription,
                selectedRole === 'restaurant' && styles.selectedText
              ]}>
                Partagez vos invendus avec les associations locales
              </Text>
              {selectedRole === 'restaurant' && isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="white" 
                  style={styles.cardLoader}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
          
          {/* Carte Association */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => animatePressIn(associationScale)}
            onPressOut={() => animatePressOut(associationScale)}
            onPress={handleSelectAssociation}
            disabled={isLoading}
          >
            <Animated.View 
              style={[
                styles.roleCard,
                styles.associationCard,
                selectedRole === 'association' && styles.selectedCard,
                { transform: [{ scale: associationScale }] }
              ]}
            >
              <View style={styles.iconContainer}>
                <FontAwesome5 
                  name="hands-helping" 
                  size={40} 
                  color={selectedRole === 'association' ? 'white' : colors.orange} 
                />
              </View>
              <Text style={[
                styles.roleTitle,
                selectedRole === 'association' && styles.selectedText
              ]}>
                Je suis une association
              </Text>
              <Text style={[
                styles.roleDescription,
                selectedRole === 'association' && styles.selectedText
              ]}>
                Récupérez les invendus pour aider vos bénéficiaires
              </Text>
              {selectedRole === 'association' && isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="white" 
                  style={styles.cardLoader}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Informations supplémentaires */}
        <View style={styles.infoContainer}>
          <FontAwesome5 name="info-circle" size={16} color="#666" />
          <Text style={styles.infoText}>
            Vous pourrez modifier votre choix plus tard dans les paramètres
          </Text>
        </View>
      </Animated.View>
      
      {/* Footer */}
      <Text style={styles.footer}>
        Ensemble contre le gaspillage alimentaire
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoWrapper: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
    lineHeight: 24,
  },
  highlightText: {
    color: colors.green,
    fontWeight: 'bold',
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  associationCard: {
    // Styles spécifiques pour la carte association si nécessaire
  },
  selectedCard: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedText: {
    color: 'white',
  },
  cardLoader: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    color: '#777',
    padding: 16,
    fontSize: 14,
  }
});

export default EcranSelectionProfil;