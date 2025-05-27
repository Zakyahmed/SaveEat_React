// ecrans/EcranDetailInvendu.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Animated,
  Image,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Linking,
  Share
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../composants/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Platform } from 'react-native';


const { width, height } = Dimensions.get('window');

const EcranDetailInvendu = ({ navigation, route }) => {
  // Paramètres et contextes
  const { id } = route.params;
  const { invendus, reserveInvendu, isLoading } = useFood();
  const { user, userType } = useAuth();
  
  // États
  const [invendu, setInvendu] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const mapSlideAnim = useRef(new Animated.Value(height)).current;
  
  // Rechercher l'invendu par ID
  useEffect(() => {
    const foundInvendu = invendus.find(item => item.id === id);
    setInvendu(foundInvendu || null);
    
    // Animation d'entrée
    if (foundInvendu) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [id, invendus]);
  
  // Animation du bouton favori
  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Afficher/masquer la carte
  const toggleMap = () => {
    const toValue = mapVisible ? height : 0;
    
    Animated.spring(mapSlideAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    
    setMapVisible(!mapVisible);
  };
  
  // Partager l'invendu
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez cette offre sur SaveEat : ${invendu.repas} chez ${invendu.restaurant}`,
        title: 'Partager cette offre',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };
  
  // Gérer la réservation
  const handleReservation = async () => {
    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour réserver un invendu.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se connecter", onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    setReservationLoading(true);
    
    try {
      await reserveInvendu(id, user.id);
      
      // Animation de succès
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        navigation.navigate('ConfirmationReservation', { id });
      });
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la réservation.",
        [{ text: "OK" }]
      );
    } finally {
      setReservationLoading(false);
    }
  };
  
  // Ouvrir l'itinéraire
  const handleGetDirections = () => {
    if (invendu?.coordinate) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${invendu.coordinate.latitude},${invendu.coordinate.longitude}`;
      Linking.openURL(url);
    }
  };
  
  // Contacter le restaurant
  const handleContact = () => {
    Alert.alert(
      "Contacter le restaurant",
      `Voulez-vous contacter ${invendu.restaurant}?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Appeler", 
          onPress: () => {
            if (invendu.telephone) {
              Linking.openURL(`tel:${invendu.telephone}`);
            }
          }
        },
        { 
          text: "Email", 
          onPress: () => {
            if (invendu.email) {
              Linking.openURL(`mailto:${invendu.email}`);
            }
          }
        }
      ]
    );
  };

  // Si l'invendu n'est pas trouvé
  if (!invendu && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <LinearGradient
          colors={[colors.green, '#2E7D32']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Détail de l'offre</Text>
            <View style={{ width: 20 }} />
          </View>
        </LinearGradient>
        
        <View style={styles.notFoundContainer}>
          <FontAwesome5 name="search" size={60} color="#ccc" />
          <Text style={styles.notFoundText}>Offre non trouvée</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Afficher un loading pendant le chargement
  if (isLoading || !invendu) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LoadingOverlay visible={true} text="Chargement des détails..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.green, '#2E7D32']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail de l'offre</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <FontAwesome5 name="share-alt" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={animateHeart} 
              style={styles.headerButton}
            >
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <FontAwesome5 name="heart" size={18} color="white" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image du plat */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Image 
            source={
              invendu.image 
                ? { uri: invendu.image }
                : require('../assets/Fichier1.png')
            } 
            style={styles.image}
            resizeMode="cover"
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <ActivityIndicator 
              style={styles.imageLoader} 
              size="large" 
              color={colors.green}
            />
          )}
          
          {/* Badges */}
          {invendu.isUrgent && (
            <View style={styles.urgentBadge}>
              <FontAwesome5 name="exclamation-circle" size={14} color="white" />
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
          
          {invendu.status === 'reserved' && (
            <View style={styles.reservedBadge}>
              <FontAwesome5 name="bookmark" size={14} color="white" />
              <Text style={styles.reservedText}>RÉSERVÉ</Text>
            </View>
          )}
        </Animated.View>
        
        {/* Informations principales */}
        <Animated.View 
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* En-tête du restaurant */}
          <View style={styles.restaurantSection}>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{invendu.restaurant}</Text>
              <View style={styles.ratingContainer}>
                <FontAwesome5 name="star" size={14} color="#FFB800" />
                <Text style={styles.rating}>4.5</Text>
                <Text style={styles.ratingCount}>(128 avis)</Text>
              </View>
              <TouchableOpacity onPress={toggleMap} style={styles.addressContainer}>
                <FontAwesome5 name="map-marker-alt" size={14} color={colors.green} />
                <Text style={styles.restaurantAddress}>
                  {invendu.adresse || "23 rue des Fleurs, Genève"}
                </Text>
                <FontAwesome5 name="chevron-down" size={12} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.distanceBadge}>
              <FontAwesome5 name="walking" size={12} color={colors.green} />
              <Text style={styles.distance}>{invendu.distance || "1.2km"}</Text>
            </View>
          </View>
          
          <View style={styles.separator} />
          
          {/* Détails du repas */}
          <View style={styles.mealSection}>
            <Text style={styles.mealName}>{invendu.repas}</Text>
            <Text style={styles.mealDescription}>
              {invendu.description || "Délicieux repas fraîchement préparé, parfait pour un déjeuner rapide et sain."}
            </Text>
            
            <View style={styles.tagsContainer}>
              {(invendu.tags || ['Végétarien', 'Sans gluten']).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            
            {/* Détails clés */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <FontAwesome5 name="boxes" size={16} color={colors.green} />
                <Text style={styles.detailLabel}>Quantité</Text>
                <Text style={styles.detailValue}>{invendu.quantite}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <FontAwesome5 name="clock" size={16} color={colors.orange} />
                <Text style={styles.detailLabel}>À récupérer</Text>
                <Text style={styles.detailValue}>{invendu.limite}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <FontAwesome5 name="thermometer-half" size={16} color="#2196F3" />
                <Text style={styles.detailLabel}>Conservation</Text>
                <Text style={styles.detailValue}>
                  {invendu.temperature || "Frais"}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Informations supplémentaires */}
        <Animated.View 
          style={[
            styles.infoCard,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.infoHeader}>
            <FontAwesome5 name="info-circle" size={18} color={colors.green} />
            <Text style={styles.infoTitle}>Informations importantes</Text>
          </View>
          
          <View style={styles.infoList}>
            {(invendu.infos || [
              'À conserver au réfrigérateur',
              'Contient: gluten, lactose',
              'Apportez vos contenants si possible'
            ]).map((info, index) => (
              <View key={index} style={styles.infoItem}>
                <FontAwesome5 name="check" size={12} color={colors.green} />
                <Text style={styles.infoText}>{info}</Text>
              </View>
            ))}
          </View>
          
          {invendu.allergenes && (
            <View style={styles.allergenesContainer}>
              <FontAwesome5 name="exclamation-triangle" size={16} color={colors.orange} />
              <Text style={styles.allergenesText}>
                Allergènes: {invendu.allergenes}
              </Text>
            </View>
          )}
        </Animated.View>
        
        {/* Actions pour les associations */}
        {userType === 'association' && invendu.status !== 'reserved' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleReservation}
              disabled={reservationLoading}
              activeOpacity={0.8}
            >
              {reservationLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <FontAwesome5 name="bookmark" size={18} color="white" />
                  <Text style={styles.primaryButtonText}>Réserver cette offre</Text>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleGetDirections}
              >
                <FontAwesome5 name="directions" size={18} color={colors.green} />
                <Text style={styles.secondaryButtonText}>Itinéraire</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleContact}
              >
                <FontAwesome5 name="phone" size={18} color={colors.green} />
                <Text style={styles.secondaryButtonText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Carte glissante */}
      <Animated.View 
        style={[
          styles.mapContainer,
          {
            transform: [{
              translateY: mapSlideAnim
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.mapCloseButton}
          onPress={toggleMap}
        >
          <FontAwesome5 name="times" size={20} color="#333" />
        </TouchableOpacity>
        
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: invendu?.coordinate?.latitude || 46.2044,
            longitude: invendu?.coordinate?.longitude || 6.1432,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: invendu?.coordinate?.latitude || 46.2044,
              longitude: invendu?.coordinate?.longitude || 6.1432,
            }}
            title={invendu.restaurant}
            description={invendu.adresse}
          />
        </MapView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  urgentBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: colors.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  urgentText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reservedBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reservedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  mainCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  restaurantSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 5,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  distance: {
    fontSize: 14,
    color: colors.green,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  mealDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  allergenesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 10,
  },
  allergenesText: {
    fontSize: 14,
    color: '#F57C00',
    flex: 1,
  },
  actionsContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.green,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.green,
    fontWeight: '500',
    fontSize: 14,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.green,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mapContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  map: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mapCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default EcranDetailInvendu;