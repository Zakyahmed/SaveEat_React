// ecrans/EcranAccueil.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import Button from '../composants/Button';
import Logo from '../composants/Logo';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const EcranAccueil = ({ navigation }) => {
  // États pour les animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  // Animation au chargement de l'écran
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
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Gestionnaires de navigation
  const handleLogin = () => {
    navigation.navigate('Login');
  };
  
  const handleRegister = () => {
    navigation.navigate('Register');
  };
  
  const handleLearnMore = () => {
    // Navigation vers une page d'information
    console.log('En savoir plus');
  };
  
  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.beige }]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Logo animé */}
        <Animated.View 
          style={[
            styles.logoWrapper,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Logo size="large" />
        </Animated.View>
        
        {/* Contenu principal dans une carte */}
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Titre principal */}
          <Text style={styles.mainTitle}>
            Bienvenue sur SaveEat
          </Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Moins de déchets, plus de partage. Connectons les restaurants aux associations pour lutter contre le gaspillage alimentaire.
          </Text>
          
          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <FontAwesome5 name="utensils" size={24} color={colors.green} />
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Restaurants</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <FontAwesome5 name="hands-helping" size={24} color={colors.orange} />
              <Text style={styles.statValue}>150+</Text>
              <Text style={styles.statLabel}>Associations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <FontAwesome5 name="leaf" size={24} color={colors.green} />
              <Text style={styles.statValue}>10k+</Text>
              <Text style={styles.statLabel}>Repas sauvés</Text>
            </View>
          </View>
          
          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <Button 
              label="Connexion"
              onPress={handleLogin}
              type="primary"
              icon="sign-in-alt"
            />
            
            <Button 
              label="Inscription"
              onPress={handleRegister}
              type="secondary"
              icon="user-plus"
            />
          </View>
          
          {/* Lien d'information */}
          <TouchableOpacity 
            style={styles.learnMoreButton}
            onPress={handleLearnMore}
          >
            <Text style={styles.learnMoreText}>En savoir plus sur notre mission</Text>
            <FontAwesome5 name="arrow-right" size={12} color={colors.green} />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
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
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: colors.green,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#555',
    fontSize: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  learnMoreText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: '#777',
    padding: 16,
    fontSize: 14,
  }
});

export default EcranAccueil;