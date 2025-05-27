// ecrans/EcranProfil.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Share,
  Platform
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { useAuth } from '../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import Card from '../composants/Card';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EcranProfil = ({ navigation }) => {
  // Contexte et états
  const { user, userType, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [achievements, setAchievements] = useState([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Données du profil
  const profilData = {
    nom: user?.name || 'Utilisateur',
    type: userType === 'restaurant' ? 'Restaurant' : 'Association',
    email: user?.email || 'email@example.com',
    telephone: user?.telephone || '+41 XX XXX XX XX',
    adresse: user?.adresse || 'Genève, Suisse',
    membre_depuis: user?.createdAt || 'Janvier 2024',
    repas_sauves: 42,
    co2_economise: 18.5,
    associations_aidees: 5,
    niveau: 3,
    points: 850,
    points_next_level: 1000,
    avatar: user?.avatar || null
  };
  
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
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: profilData.points / profilData.points_next_level,
        duration: 1000,
        delay: 500,
        useNativeDriver: false,
      })
    ]).start();
    
    // Animation de rotation continue pour le badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Chargement des achievements
  useEffect(() => {
    // Simuler le chargement des achievements
    setTimeout(() => {
      setAchievements([
        { id: 1, title: 'Premier don', icon: 'gift', unlocked: true },
        { id: 2, title: '10 repas sauvés', icon: 'utensils', unlocked: true },
        { id: 3, title: 'Éco-héros', icon: 'leaf', unlocked: true },
        { id: 4, title: '50 repas sauvés', icon: 'trophy', unlocked: false },
      ]);
    }, 500);
  }, []);
  
  // Générer les initiales pour l'avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Partager le profil
  const handleShare = async () => {
    try {
      await Share.share({
        message: `J'ai sauvé ${profilData.repas_sauves} repas avec SaveEat ! 🌱 Rejoignez-moi pour lutter contre le gaspillage alimentaire.`,
        title: 'Mon impact SaveEat',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };
  
  // Gérer la déconnexion
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            
            try {
              const result = await logout();
              
              if (result.success) {
                // Animation de sortie
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
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                  });
                });
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de se déconnecter');
                setIsLoggingOut(false);
              }
            } catch (error) {
              console.error('Erreur lors de la déconnexion', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
              setIsLoggingOut(false);
            }
          } 
        }
      ]
    );
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.green, '#2E7D32']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <FontAwesome5 name="share-alt" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {isLoggingOut ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Déconnexion en cours...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Profil */}
          <Animated.View 
            style={[
              styles.profilSection,
              { 
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ] 
              }
            ]}
          >
            <View style={styles.avatarContainer}>
              {profilData.avatar ? (
                <Image 
                  source={{ uri: profilData.avatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <LinearGradient
                  colors={[colors.green, '#2E7D32']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>
                    {getInitials(profilData.nom)}
                  </Text>
                </LinearGradient>
              )}
              
              {/* Badge de niveau */}
              <Animated.View 
                style={[
                  styles.levelBadge,
                  { transform: [{ rotate: spin }] }
                ]}
              >
                <Text style={styles.levelText}>{profilData.niveau}</Text>
              </Animated.View>
            </View>
            
            <Text style={styles.profilNom}>{profilData.nom}</Text>
            <View style={styles.typeContainer}>
              <View style={styles.typeTag}>
                <FontAwesome5 
                  name={userType === 'restaurant' ? 'utensils' : 'hands-helping'} 
                  size={12} 
                  color={colors.green} 
                />
                <Text style={styles.profilType}>{profilData.type}</Text>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <FontAwesome5 name="envelope" size={14} color="#666" />
                <Text style={styles.infoText}>{profilData.email}</Text>
              </View>
              <View style={styles.infoItem}>
                <FontAwesome5 name="map-marker-alt" size={14} color="#666" />
                <Text style={styles.infoText}>{profilData.adresse}</Text>
              </View>
              <View style={styles.infoItem}>
                <FontAwesome5 name="calendar" size={14} color="#666" />
                <Text style={styles.infoText}>Membre depuis {profilData.membre_depuis}</Text>
              </View>
            </View>
            
            {/* Barre de progression */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Niveau {profilData.niveau}</Text>
                <Text style={styles.progressPoints}>
                  {profilData.points} / {profilData.points_next_level} pts
                </Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]}
                />
              </View>
            </View>
          </Animated.View>
          
          {/* Statistiques d'impact */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <View style={styles.impactHeader}>
              <Text style={styles.cardTitle}>Mon Impact</Text>
              <TouchableOpacity style={styles.infoButton}>
                <FontAwesome5 name="info-circle" size={16} color={colors.green} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <FontAwesome5 name="utensils" size={24} color={colors.green} />
                </View>
                <Text style={[styles.statValue, { color: colors.green }]}>
                  {profilData.repas_sauves}
                </Text>
                <Text style={styles.statLabel}>Repas sauvés</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <FontAwesome5 name="leaf" size={24} color={colors.orange} />
                </View>
                <Text style={[styles.statValue, { color: colors.orange }]}>
                  {profilData.co2_economise} kg
                </Text>
                <Text style={styles.statLabel}>CO₂ économisé</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <FontAwesome5 name="hands-helping" size={24} color={colors.green} />
                </View>
                <Text style={[styles.statValue, { color: colors.green }]}>
                  {profilData.associations_aidees}
                </Text>
                <Text style={styles.statLabel}>Associations</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Achievements */}
          <Animated.View 
            style={[
              styles.card,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.cardTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <Animated.View
                  key={achievement.id}
                  style={[
                    styles.achievementItem,
                    !achievement.unlocked && styles.achievementLocked,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <FontAwesome5 
                    name={achievement.icon} 
                    size={24} 
                    color={achievement.unlocked ? colors.green : '#ccc'} 
                  />
                  <Text style={[
                    styles.achievementText,
                    !achievement.unlocked && styles.achievementTextLocked
                  ]}>
                    {achievement.title}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
          
          {/* Actions */}
          <Animated.View 
            style={[
              styles.card, 
              { opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditerProfil')}
            >
              <View style={styles.actionLeft}>
                <FontAwesome5 name="user-edit" size={18} color={colors.green} />
                <Text style={styles.actionText}>Éditer le profil</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
            </TouchableOpacity>
            
            <View style={styles.buttonDivider} />
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Parametres')}
            >
              <View style={styles.actionLeft}>
                <FontAwesome5 name="cog" size={18} color="#666" />
                <Text style={[styles.actionText, { color: '#666' }]}>Paramètres</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
            </TouchableOpacity>
            
            <View style={styles.buttonDivider} />
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Support')}
            >
              <View style={styles.actionLeft}>
                <FontAwesome5 name="question-circle" size={18} color="#666" />
                <Text style={[styles.actionText, { color: '#666' }]}>Aide & Support</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
            </TouchableOpacity>
            
            <View style={styles.buttonDivider} />
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <View style={styles.actionLeft}>
                <FontAwesome5 name="sign-out-alt" size={18} color="#f44336" />
                <Text style={[styles.actionText, { color: '#f44336' }]}>Déconnexion</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Version de l'app */}
          <Text style={styles.versionText}>SaveEat v1.0.0</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  profilSection: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profilNom: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  typeContainer: {
    marginBottom: 15,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.green}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  profilType: {
    fontSize: 14,
    color: colors.green,
    fontWeight: '600',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPoints: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#eee',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  achievementItem: {
    width: (width - 40 - 60) / 4,
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
  },
  achievementTextLocked: {
    color: '#999',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.green,
  },
  buttonDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 30,
  },
});

export default EcranProfil;