// ecrans/EcranMesReservations.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  Alert,
  RefreshControl,
  Animated,
  StatusBar,
  Dimensions,
  SectionList,
  Platform
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useAuth } from '../context/AuthContext';
import Card from '../composants/Card';
import LoadingOverlay from '../composants/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const EcranMesReservations = ({ navigation }) => {
  // États et contextes
  const { user } = useAuth();
  const { reservations, invendus, updateReservation } = useFood();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const mapSlideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Filtrer les réservations de l'utilisateur
  const userReservations = reservations
    .filter(res => res.userId === user?.id)
    .map(res => ({
      ...res,
      invendu: invendus.find(inv => inv.id === res.invenduId)
    }))
    .filter(res => res.invendu); // Filtrer les réservations sans invendu correspondant
  
  // Séparer les réservations actives et l'historique
  const sections = [
    {
      title: 'À récupérer',
      data: userReservations.filter(r => r.status === 'pending'),
      key: 'active'
    },
    {
      title: 'Historique',
      data: userReservations.filter(r => r.status === 'collected' || r.status === 'cancelled'),
      key: 'history'
    }
  ];
  
  // Animation au chargement
  useEffect(() => {
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
      })
    ]).start();
    
    // Animation de pulsation pour les réservations actives
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Rafraîchir les données
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);
  
  // Annuler une réservation
  const handleCancelReservation = (reservation) => {
    Alert.alert(
      "Annuler la réservation",
      `Êtes-vous sûr de vouloir annuler votre réservation chez ${reservation.invendu.restaurant} ?`,
      [
        { text: "Non", style: "cancel" },
        { 
          text: "Oui, annuler", 
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateReservation(reservation.id, { status: 'cancelled' });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Succès", "Votre réservation a été annulée");
            } catch (error) {
              Alert.alert("Erreur", "Impossible d'annuler la réservation");
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };
  
  // Confirmer la collecte
  const handleConfirmCollection = async (reservation) => {
    setIsUpdating(true);
    try {
      await updateReservation(reservation.id, { status: 'collected' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        "Collecte confirmée !",
        "Merci d'avoir contribué à la lutte contre le gaspillage alimentaire.",
        [
          { 
            text: "Évaluer", 
            onPress: () => navigation.navigate('EvaluerExperience', { reservationId: reservation.id })
          },
          { text: "OK" }
        ]
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de confirmer la collecte");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Ouvrir l'itinéraire
  const handleGetDirections = (reservation) => {
    const { coordinate } = reservation.invendu;
    if (coordinate) {
      const url = Platform.OS === 'ios'
        ? `maps:0,0?q=${coordinate.latitude},${coordinate.longitude}`
        : `geo:0,0?q=${coordinate.latitude},${coordinate.longitude}`;
      Linking.openURL(url);
    }
  };
  
  // Appeler le restaurant
  const handleCallRestaurant = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };
  
  // Afficher/masquer la carte
  const toggleMap = (reservation) => {
    setSelectedReservation(reservation);
    const toValue = mapVisible ? height : 0;
    
    Animated.spring(mapSlideAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    
    setMapVisible(!mapVisible);
  };
  
  // Rendu du statut
  const renderStatus = (status) => {
    const statusConfig = {
      pending: { label: 'À récupérer', color: colors.green, icon: 'clock' },
      collected: { label: 'Collecté', color: '#4CAF50', icon: 'check-circle' },
      cancelled: { label: 'Annulé', color: '#999', icon: 'times-circle' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
        <FontAwesome5 name={config.icon} size={12} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };
  
  // Calculer le temps restant
  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const limit = new Date(deadline);
    const diff = limit - now;
    
    if (diff <= 0) return "Expiré";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${minutes}min`;
  };
  
  // Rendu d'une réservation
  const renderReservation = ({ item: reservation, index, section }) => {
    const isActive = section.key === 'active';
    const animValue = new Animated.Value(0);
    
    Animated.timing(animValue, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
    
    return (
      <Animated.View
        style={[
          styles.reservationCard,
          !isActive && styles.historyCard,
          {
            opacity: animValue,
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              },
              isActive && { scale: pulseAnim }
            ].filter(Boolean)
          }
        ]}
      >
        {/* Header de la carte */}
        <View style={styles.cardHeader}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{reservation.invendu.restaurant}</Text>
            <Text style={styles.mealName}>{reservation.invendu.repas}</Text>
          </View>
          {renderStatus(reservation.status)}
        </View>
        
        {/* Détails */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <FontAwesome5 name="boxes" size={14} color="#666" />
            <Text style={styles.detailText}>{reservation.invendu.quantite}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="map-marker-alt" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {reservation.invendu.adresse}
            </Text>
          </View>
          
          {isActive && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={14} color={colors.orange} />
              <Text style={[styles.detailText, { color: colors.orange, fontWeight: '600' }]}>
                Reste {getTimeRemaining(reservation.invendu.limite)}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar" size={14} color="#666" />
            <Text style={styles.detailText}>
              Réservé le {new Date(reservation.dateReservation).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
        
        {/* Code de récupération */}
        {isActive && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Code de récupération</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{reservation.code || 'SAV-4821'}</Text>
            </View>
          </View>
        )}
        
        {/* Actions */}
        {isActive && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.primaryAction}
              onPress={() => handleGetDirections(reservation)}
            >
              <FontAwesome5 name="directions" size={16} color="white" />
              <Text style={styles.primaryActionText}>Itinéraire</Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => toggleMap(reservation)}
              >
                <FontAwesome5 name="map" size={16} color={colors.green} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => handleCallRestaurant(reservation.invendu.telephone)}
              >
                <FontAwesome5 name="phone" size={16} color={colors.green} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => handleConfirmCollection(reservation)}
              >
                <FontAwesome5 name="check" size={16} color="#4CAF50" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryAction, { borderColor: '#f44336' }]}
                onPress={() => handleCancelReservation(reservation)}
              >
                <FontAwesome5 name="times" size={16} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Statut pour l'historique */}
        {!isActive && reservation.status === 'collected' && (
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => navigation.navigate('EvaluerExperience', { reservationId: reservation.id })}
          >
            <FontAwesome5 name="star" size={14} color={colors.orange} />
            <Text style={styles.reviewButtonText}>Évaluer cette expérience</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };
  
  // Header de section
  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );
  
  // Séparateur de section
  const renderSectionSeparator = () => <View style={styles.sectionSeparator} />;
  
  // État vide
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={[
          styles.emptyContent,
          { 
            opacity: fadeAnim,
            transform: [{ scale: fadeAnim }]
          }
        ]}
      >
        <FontAwesome5 name="shopping-basket" size={80} color="#ddd" />
        <Text style={styles.emptyText}>
          Vous n'avez pas encore de réservations
        </Text>
        <Text style={styles.emptySubText}>
          Explorez les offres disponibles près de vous
        </Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.navigate('AssociationHome')}
        >
          <FontAwesome5 name="search" size={16} color="white" />
          <Text style={styles.browseButtonText}>Parcourir les offres</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.green, '#2E7D32']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes réservations</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('HistoriqueComplet')}
          >
            <FontAwesome5 name="history" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Statistiques rapides */}
      <Animated.View 
        style={[
          styles.quickStats,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.quickStatItem}>
          <FontAwesome5 name="clock" size={20} color={colors.green} />
          <Text style={styles.quickStatValue}>
            {sections[0].data.length}
          </Text>
          <Text style={styles.quickStatLabel}>En cours</Text>
        </View>
        
        <View style={styles.quickStatDivider} />
        
        <View style={styles.quickStatItem}>
          <FontAwesome5 name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.quickStatValue}>
            {userReservations.filter(r => r.status === 'collected').length}
          </Text>
          <Text style={styles.quickStatLabel}>Collectées</Text>
        </View>
        
        <View style={styles.quickStatDivider} />
        
        <View style={styles.quickStatItem}>
          <FontAwesome5 name="leaf" size={20} color={colors.orange} />
          <Text style={styles.quickStatValue}>
            {userReservations.reduce((acc, r) => acc + (r.invendu?.co2Saved || 2.5), 0).toFixed(1)} kg
          </Text>
          <Text style={styles.quickStatLabel}>CO₂ économisé</Text>
        </View>
      </Animated.View>
      
      {/* Liste des réservations */}
      <SectionList
        sections={sections}
        renderItem={renderReservation}
        renderSectionHeader={renderSectionHeader}
        SectionSeparatorComponent={renderSectionSeparator}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.green]}
          />
        }
        stickySectionHeadersEnabled={false}
      />
      
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
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>
            {selectedReservation?.invendu.restaurant}
          </Text>
          <TouchableOpacity 
            style={styles.mapCloseButton}
            onPress={() => toggleMap(null)}
          >
            <FontAwesome5 name="times" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: selectedReservation?.invendu.coordinate?.latitude || 46.2044,
            longitude: selectedReservation?.invendu.coordinate?.longitude || 6.1432,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {selectedReservation && (
            <Marker
              coordinate={{
                latitude: selectedReservation.invendu.coordinate?.latitude || 46.2044,
                longitude: selectedReservation.invendu.coordinate?.longitude || 6.1432,
              }}
              title={selectedReservation.invendu.restaurant}
              description={selectedReservation.invendu.adresse}
            >
              <View style={styles.customMarker}>
                <FontAwesome5 name="utensils" size={16} color="white" />
              </View>
            </Marker>
          )}
        </MapView>
        
        <TouchableOpacity 
          style={styles.mapDirectionsButton}
          onPress={() => selectedReservation && handleGetDirections(selectedReservation)}
        >
          <FontAwesome5 name="directions" size={18} color="white" />
          <Text style={styles.mapDirectionsText}>Obtenir l'itinéraire</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {isUpdating && <LoadingOverlay visible={true} text="Mise à jour..." />}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: -10,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionSeparator: {
    height: 10,
  },
  reservationCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  historyCard: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  mealName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  codeContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  codeBox: {
    backgroundColor: colors.green,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  codeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 2,
  },
  actionsContainer: {
    gap: 10,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.green,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  reviewButtonText: {
    color: colors.orange,
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  mapCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    margin: 15,
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  mapDirectionsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EcranMesReservations;