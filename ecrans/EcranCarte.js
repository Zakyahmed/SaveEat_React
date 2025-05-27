// ecrans/EcranCarte.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  Platform,
  FlatList
} from 'react-native';
import MapView, { Marker, Callout, Circle, PROVIDER_GOOGLE } from 'react-native-maps'; 
import * as Location from 'expo-location'; 
import { colors } from '../constantes/couleurs';
import { useAuth } from '../context/AuthContext';
import { useFood } from '../context/FoodContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 200;
const CARD_WIDTH = width * 0.85;

const EcranCarte = ({ navigation }) => {
  // Contextes
  const { userType, user } = useAuth();
  const { invendus, restaurants, associations } = useFood();
  
  // États
  const [region, setRegion] = useState({
    latitude: 46.2044,
    longitude: 6.1432,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filterRadius, setFilterRadius] = useState(5); // km
  const [showFilters, setShowFilters] = useState(false);
  const [mapType, setMapType] = useState('standard');
  
  // Refs
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const scrollViewRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const filterSlideAnim = useRef(new Animated.Value(-200)).current;
  const cardSlideAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;
  
  // Style de carte personnalisé
  const mapStyle = [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ];
  
  // Obtenir les marqueurs selon le type d'utilisateur
  const markers = useMemo(() => {
    if (userType === 'restaurant') {
      // Pour les restaurants, afficher les associations
      return associations.map(assoc => ({
        id: assoc.id,
        type: 'association',
        coordinate: {
          latitude: assoc.latitude || 46.2044 + (Math.random() - 0.5) * 0.1,
          longitude: assoc.longitude || 6.1432 + (Math.random() - 0.5) * 0.1,
        },
        title: assoc.name,
        description: assoc.address,
        distance: assoc.distance || `${(Math.random() * 5).toFixed(1)} km`,
        capacity: assoc.capacity || '50-100 repas/jour',
        contact: assoc.contact
      }));
    } else {
      // Pour les associations, afficher les restaurants avec invendus
      const restaurantsWithInvendus = invendus
        .filter(inv => inv.status === 'pending')
        .map(inv => {
          const restaurant = restaurants.find(r => r.id === inv.restaurantId) || {};
          return {
            id: inv.id,
            type: 'restaurant',
            coordinate: {
              latitude: restaurant.latitude || 46.2044 + (Math.random() - 0.5) * 0.1,
              longitude: restaurant.longitude || 6.1432 + (Math.random() - 0.5) * 0.1,
            },
            title: inv.restaurant,
            description: inv.repas,
            quantity: inv.quantite,
            limit: inv.limite,
            distance: restaurant.distance || `${(Math.random() * 5).toFixed(1)} km`,
            isUrgent: inv.isUrgent
          };
        });
      return restaurantsWithInvendus;
    }
  }, [userType, invendus, restaurants, associations]);
  
  // Filtrer les marqueurs par distance
  const filteredMarkers = useMemo(() => {
    if (!userLocation) return markers;
    
    return markers.filter(marker => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        marker.coordinate.latitude,
        marker.coordinate.longitude
      );
      return distance <= filterRadius;
    });
  }, [markers, userLocation, filterRadius]);
  
  // Calculer la distance entre deux points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Obtenir la position de l'utilisateur
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission refusée',
            'L\'accès à votre position est nécessaire pour afficher les offres près de vous.'
          );
          setLoadingLocation(false);
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        const { latitude, longitude } = location.coords;
        
        setUserLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
        
        // Animation d'entrée
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          })
        ]).start();
      } catch (error) {
        console.log('Erreur lors de la récupération de la position:', error);
        Alert.alert('Erreur', 'Impossible de récupérer votre position');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);
  
  // Centrer sur la position de l'utilisateur
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Gérer la sélection d'un marqueur
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    
    // Animer la carte vers le marqueur
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...marker.coordinate,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      }, 500);
    }
    
    // Afficher la carte de détail
    Animated.spring(cardSlideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Fermer la carte de détail
  const closeDetailCard = () => {
    Animated.timing(cardSlideAnim, {
      toValue: CARD_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setSelectedMarker(null));
  };
  
  // Basculer les filtres
  const toggleFilters = () => {
    const toValue = showFilters ? -200 : 0;
    
    Animated.spring(filterSlideAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    
    setShowFilters(!showFilters);
  };
  
  // Naviguer vers les détails
  const handleNavigateToDetails = () => {
    if (selectedMarker) {
      if (userType === 'association' && selectedMarker.type === 'restaurant') {
        navigation.navigate('DetailInvendu', { id: selectedMarker.id });
      } else if (userType === 'restaurant' && selectedMarker.type === 'association') {
        navigation.navigate('DetailAssociation', { id: selectedMarker.id });
      }
    }
  };
  
  // Rendu d'un marqueur personnalisé
  const renderMarker = (marker) => {
    const isSelected = selectedMarker?.id === marker.id;
    
    return (
      <Marker
        key={marker.id}
        ref={ref => markerRefs.current[marker.id] = ref}
        coordinate={marker.coordinate}
        onPress={() => handleMarkerPress(marker)}
      >
        <Animated.View 
          style={[
            styles.markerContainer,
            isSelected && styles.selectedMarker
          ]}
        >
          <View style={[
            styles.markerInner,
            { backgroundColor: marker.type === 'restaurant' ? colors.green : colors.orange }
          ]}>
            <FontAwesome5 
              name={marker.type === 'restaurant' ? 'utensils' : 'hands-helping'} 
              size={16} 
              color="white" 
            />
          </View>
          {marker.isUrgent && (
            <View style={styles.urgentIndicator}>
              <FontAwesome5 name="exclamation" size={8} color="white" />
            </View>
          )}
        </Animated.View>
      </Marker>
    );
  };
  
  // Rendu du contenu de chargement
  if (loadingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.green, '#2E7D32']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Carte</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Récupération de votre position...</Text>
        </View>
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
          <Text style={styles.headerTitle}>
            {userType === 'restaurant' ? 'Associations proches' : 'Invendus disponibles'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={toggleFilters}
            >
              <FontAwesome5 name="filter" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
            >
              <FontAwesome5 name="layer-group" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          mapType={mapType}
          customMapStyle={mapStyle}
          onRegionChangeComplete={setRegion}
        >
          {/* Cercle de rayon de recherche */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={filterRadius * 1000}
              fillColor="rgba(76, 175, 80, 0.1)"
              strokeColor="rgba(76, 175, 80, 0.3)"
              strokeWidth={1}
            />
          )}
          
          {/* Marqueurs */}
          {filteredMarkers.map(renderMarker)}
        </MapView>
        
        {/* Bouton de localisation */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={centerOnUserLocation}
        >
          <FontAwesome5 name="location-arrow" size={20} color={colors.green} />
        </TouchableOpacity>
        
        {/* Badge de compteur */}
        <Animated.View 
          style={[
            styles.counterBadge,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.counterText}>
            {filteredMarkers.length} {userType === 'restaurant' ? 'associations' : 'offres'}
          </Text>
        </Animated.View>
      </View>
      
      {/* Panneau de filtres */}
      <Animated.View 
        style={[
          styles.filtersPanel,
          {
            transform: [{ translateX: filterSlideAnim }]
          }
        ]}
      >
        <Text style={styles.filterTitle}>Filtres</Text>
        
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Rayon de recherche</Text>
          <View style={styles.radiusOptions}>
            {[1, 2, 5, 10].map(radius => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  filterRadius === radius && styles.radiusButtonActive
                ]}
                onPress={() => setFilterRadius(radius)}
              >
                <Text style={[
                  styles.radiusButtonText,
                  filterRadius === radius && styles.radiusButtonTextActive
                ]}>
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {userType === 'association' && (
          <View style={styles.filterItem}>
            <TouchableOpacity style={styles.urgentFilter}>
              <FontAwesome5 name="exclamation-circle" size={16} color={colors.orange} />
              <Text style={styles.urgentFilterText}>Uniquement les urgents</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
      
      {/* Carte de détail */}
      {selectedMarker && (
        <Animated.View 
          style={[
            styles.detailCard,
            {
              transform: [{ translateY: cardSlideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.cardCloseButton}
            onPress={closeDetailCard}
          >
            <FontAwesome5 name="times" size={16} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.cardIcon,
                { backgroundColor: selectedMarker.type === 'restaurant' ? colors.green : colors.orange }
              ]}>
                <FontAwesome5 
                  name={selectedMarker.type === 'restaurant' ? 'utensils' : 'hands-helping'} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{selectedMarker.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {selectedMarker.type === 'restaurant' 
                    ? selectedMarker.description 
                    : selectedMarker.capacity}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardDetails}>
              <View style={styles.cardDetailItem}>
                <FontAwesome5 name="map-marker-alt" size={14} color="#666" />
                <Text style={styles.cardDetailText}>{selectedMarker.distance}</Text>
              </View>
              
              {selectedMarker.type === 'restaurant' && (
                <>
                  <View style={styles.cardDetailItem}>
                    <FontAwesome5 name="boxes" size={14} color="#666" />
                    <Text style={styles.cardDetailText}>{selectedMarker.quantity}</Text>
                  </View>
                  <View style={styles.cardDetailItem}>
                    <FontAwesome5 name="clock" size={14} color={colors.orange} />
                    <Text style={styles.cardDetailText}>{selectedMarker.limit}</Text>
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.directionsButton}
                onPress={() => {
                  const url = Platform.OS === 'ios'
                    ? `maps:0,0?q=${selectedMarker.coordinate.latitude},${selectedMarker.coordinate.longitude}`
                    : `geo:0,0?q=${selectedMarker.coordinate.latitude},${selectedMarker.coordinate.longitude}`;
                  Linking.openURL(url);
                }}
              >
                <FontAwesome5 name="directions" size={16} color={colors.green} />
                <Text style={styles.directionsButtonText}>Itinéraire</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={handleNavigateToDetails}
              >
                <Text style={styles.detailsButtonText}>Voir les détails</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
      
      {/* Info banner */}
      {userType === 'restaurant' && (
        <Animated.View 
          style={[
            styles.infoBanner,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <FontAwesome5 name="info-circle" size={14} color={colors.green} />
          <Text style={styles.infoBannerText}>
            Cliquez sur une association pour voir ses informations
          </Text>
        </Animated.View>
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
    gap: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  counterBadge: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  urgentIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  filtersPanel: {
    position: 'absolute',
    left: 0,
    top: StatusBar.currentHeight + 80,
    width: 200,
    backgroundColor: 'white',
    padding: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterItem: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  radiusButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  radiusButtonText: {
    fontSize: 12,
    color: '#666',
  },
  radiusButtonTextActive: {
    color: 'white',
  },
  urgentFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  urgentFilterText: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '500',
  },
  detailCard: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.green,
    gap: 8,
  },
  directionsButtonText: {
    color: colors.green,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: colors.green,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  infoBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
});

export default EcranCarte;