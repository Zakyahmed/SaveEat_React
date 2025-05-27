// ecrans/EcranInscription.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Animated,
  StatusBar
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import Header from '../composants/Header';
import Button from '../composants/Button';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const EcranInscription = ({ navigation }) => {
  // États du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  
  // Contexte d'authentification
  const { register } = useAuth();
  
  // Animation au chargement
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Animation de la checkbox
  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isChecked ? 1 : 0,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isChecked]);
  
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
  
  // Mise à jour du formulaire
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ lors de la modification
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validation de l'email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Validation du mot de passe
  const validatePassword = (password) => {
    return password.length >= 8;
  };
  
  // Force du mot de passe
  const getPasswordStrength = (password) => {
    if (!password) return null;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    if (strength <= 1) return { level: 'Faible', color: '#f44336' };
    if (strength === 2) return { level: 'Moyen', color: colors.orange };
    return { level: 'Fort', color: colors.green };
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    // Validation du nom
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation de l'email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    // Validation de la confirmation du mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Validation des conditions
    if (!isChecked) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    
    // Animation si erreurs
    if (Object.keys(newErrors).length > 0) {
      shakeAnimation();
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaire d'inscription
  const handleRegistration = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Erreur d\'inscription', 
        'Veuillez corriger les erreurs dans le formulaire.'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await register({
        name: formData.nom,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        Alert.alert(
          'Inscription réussie',
          'Votre compte a été créé avec succès !',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('SelectProfile')
            }
          ]
        );
      } else {
        Alert.alert(
          'Erreur d\'inscription',
          result.error || 'Une erreur est survenue lors de l\'inscription'
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      Alert.alert(
        'Erreur',
        'Une erreur inattendue est survenue'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Header 
        title="Inscription" 
        showBack={true}
        onBack={() => navigation.goBack()}
        backgroundColor={colors.green}
        textColor="white"
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo animé */}
          <Animated.View 
            style={[
              styles.logoContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.logoText}>
              <Text style={{ color: colors.orange }}>Save</Text>
              <Text style={{ color: colors.green }}>Eat</Text>
            </Text>
            <Text style={styles.tagline}>Créer votre compte</Text>
          </Animated.View>
          
          {/* Formulaire animé */}
          <Animated.View 
            style={[
              styles.formContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateX: shakeAnim }]
              }
            ]}
          >
            {/* Champ Nom */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={[
                styles.inputWrapper,
                errors.nom ? styles.inputWrapperError : null
              ]}>
                <FontAwesome5 
                  name="user" 
                  size={18} 
                  color={errors.nom ? '#f44336' : '#999'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.nom}
                  onChangeText={(text) => updateFormData('nom', text)}
                  placeholder="Jean Dupont"
                  autoCorrect={false}
                />
              </View>
              {errors.nom && <Text style={styles.errorText}>{errors.nom}</Text>}
            </View>
            
            {/* Champ Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
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
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  placeholder="votre@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            
            {/* Champ Mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
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
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  placeholder="8 caractères minimum"
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
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              
              {/* Indicateur de force du mot de passe */}
              {passwordStrength && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View 
                      style={[
                        styles.passwordStrengthFill,
                        { 
                          backgroundColor: passwordStrength.color,
                          width: passwordStrength.level === 'Faible' ? '33%' : 
                                 passwordStrength.level === 'Moyen' ? '66%' : '100%'
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.level}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Champ Confirmer le mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={[
                styles.inputWrapper,
                errors.confirmPassword ? styles.inputWrapperError : null
              ]}>
                <FontAwesome5 
                  name="lock" 
                  size={18} 
                  color={errors.confirmPassword ? '#f44336' : '#999'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateFormData('confirmPassword', text)}
                  placeholder="Répétez votre mot de passe"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome5 
                    name={showConfirmPassword ? "eye-slash" : "eye"} 
                    size={18} 
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
            
            {/* Conditions d'utilisation */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setIsChecked(!isChecked)}
              >
                <Animated.View
                  style={[
                    styles.checkboxInner,
                    {
                      transform: [{ scale: checkAnim }],
                      opacity: checkAnim
                    }
                  ]}
                >
                  <FontAwesome5 name="check" size={12} color="white" />
                </Animated.View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                J'accepte les{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => console.log('Conditions')}
                >
                  conditions d'utilisation
                </Text>
                {' '}et la{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => console.log('Politique')}
                >
                  politique de confidentialité
                </Text>
              </Text>
            </View>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
            
            {/* Bouton d'inscription */}
            <Button 
              label={isLoading ? "Inscription..." : "Créer un compte"}
              onPress={handleRegistration}
              type="primary"
              disabled={isLoading}
              icon={isLoading ? null : "user-plus"}
            />
            
            {/* Lien de connexion */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
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
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.green,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.green,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#777',
    fontSize: 14,
  },
  loginLink: {
    color: colors.green,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default EcranInscription;