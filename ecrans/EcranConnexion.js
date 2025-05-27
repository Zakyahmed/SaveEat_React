// ecrans/EcranConnexion.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import Header from '../composants/Header';
import Button from '../composants/Button';
import Logo from '../composants/Logo';
import { useAuth } from '../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';

const EcranConnexion = ({ navigation }) => {
  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Récupération du contexte d'authentification
  const { login } = useAuth();
  
  // Animation au chargement
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Animation de secousse pour les erreurs
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    
    // Animation si erreurs
    if (Object.keys(newErrors).length > 0) {
      shakeAnimation();
    }
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Gestionnaire de connexion
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Réinitialiser le formulaire
        setEmail('');
        setPassword('');
        setErrors({});
        
        // Navigation vers la sélection de profil
        navigation.navigate('SelectProfile');
      } else {
        Alert.alert(
          'Erreur de connexion', 
          result.error || 'Identifiants invalides',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue lors de la connexion',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestionnaire pour le mot de passe oublié
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  // Gestionnaire pour l'inscription
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: colors.beige }]}>
      <Header 
        title="Connexion" 
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo animé */}
          <Animated.View 
            style={[
              styles.logoWrapper,
              { opacity: fadeAnim }
            ]}
          >
            <Logo size="medium" />
          </Animated.View>

          {/* Formulaire dans une carte */}
          <Animated.View 
            style={[
              styles.formContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateX: shakeAnim }]
              }
            ]}
          >
            {/* Titre de bienvenue */}
            <Text style={styles.welcomeTitle}>Bon retour !</Text>
            <Text style={styles.welcomeSubtitle}>
              Connectez-vous pour continuer
            </Text>
            
            {/* Champ Email */}
            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                errors.email ? styles.inputWrapperError : null
              ]}>
                <FontAwesome5 
                  name="envelope" 
                  size={18} 
                  color={errors.email ? '#f44336' : '#999'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: null });
                    }
                  }}
                  placeholder="votre@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text style={globalStyles.errorText}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={globalStyles.label}>Mot de passe</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPassword}>
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputWrapper,
                errors.password ? styles.inputWrapperError : null
              ]}>
                <FontAwesome5 
                  name="lock" 
                  size={18} 
                  color={errors.password ? '#f44336' : '#999'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: null });
                    }
                  }}
                  placeholder="********"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome5 
                    name={showPassword ? "eye-slash" : "eye"} 
                    size={18} 
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={globalStyles.errorText}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Bouton de connexion */}
            <Button 
              label={isLoading ? "Connexion..." : "Se connecter"}
              onPress={handleLogin}
              type="primary"
              disabled={isLoading}
              icon={isLoading ? null : "sign-in-alt"}
            />
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <ActivityIndicator 
                size="small" 
                color={colors.green} 
                style={styles.loader}
              />
            )}

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OU</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Lien d'inscription */}
            <View style={styles.registerLink}>
              <Text style={styles.registerText}>
                Pas encore de compte ? 
              </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerButton}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  contentContainer: { 
    flexGrow: 1,
    justifyContent: 'center', 
    padding: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: colors.green,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#f9f9f9',
  },
  inputWrapperError: {
    borderColor: '#f44336',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    marginRight: 10,
    width: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 5,
  },
  loader: {
    marginTop: 10,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#777',
    fontSize: 14,
  },
  registerButton: {
    color: colors.green,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  }
});

export default EcranConnexion;