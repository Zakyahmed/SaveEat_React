// ecrans/EcranMesDons.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  StatusBar,
  Dimensions,
  FlatList
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useAuth } from '../context/AuthContext';
import Card from '../composants/Card';
import LoadingOverlay from '../composants/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EcranMesDons = ({ navigation }) => {
  // États et contextes
  const { user } = useAuth();
  const { invendus, deleteInvendu, updateInvendu } = useFood();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterSlideAnim = useRef(new Animated.Value(-100)).current;
  
  // Filtrer les dons de l'utilisateur
  const userDons = invendus.filter(don => don.restaurantId === user?.id);
  
  // Appliquer les filtres
  const filteredDons = userDons.filter(don => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return don.status === 'pending' || don.status === 'reserved';
    if (selectedFilter === 'completed') return don.status === 'completed';
    if (selectedFilter === 'expired') return don.status === 'expired';
    return true;
  });
  
  // Trier les dons
  const sortedDons = [...filteredDons].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.dateAjout) - new Date(a.dateAjout);
    }
    if (sortBy === 'status') {
      const statusOrder = { pending: 0, reserved: 1, completed: 2, expired: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return 0;
  });
  
  // Statistiques
  const stats = {
    total: userDons.length,
    active: userDons.filter(d => d.status === 'pending' || d.status === 'reserved').length,
    completed: userDons.filter(d => d.status === 'completed').length,
    expired: userDons.filter(d => d.status === 'expired').length,
  };
  
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
      }),
      Animated.spring(filterSlideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Rafraîchir les données
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simuler un rafraîchissement
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);
  
  // Supprimer un don
  const handleDeleteDon = (don) => {
    Alert.alert(
      "Supprimer le don",
      `Êtes-vous sûr de vouloir supprimer "${don.titre || don.repas}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteInvendu(don.id);
              Alert.alert("Succès", "Le don a été supprimé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le don");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  // Modifier un don
  const handleEditDon = (don) => {
    navigation.navigate('ModifierDon', { don });
  };
  
  // Voir les détails d'un don
  const handleViewDetails = (don) => {
    navigation.navigate('DetailDonRestaurant', { id: don.id });
  };
  
  // Marquer comme collecté
  const handleMarkAsCollected = async (don) => {
    try {
      await updateInvendu(don.id, { ...don, status: 'completed' });
      Alert.alert("Succès", "Le don a été marqué comme collecté");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut");
    }
  };
  
  // Rendu du statut
  const renderStatus = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', color: colors.green, icon: 'clock' },
      reserved: { label: 'Réservé', color: colors.orange, icon: 'bookmark' },
      completed: { label: 'Collecté', color: '#4CAF50', icon: 'check-circle' },
      expired: { label: 'Expiré', color: '#999', icon: 'times-circle' }
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
  
  // Rendu d'un don
  const renderDon = ({ item: don, index }) => {
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
          styles.donCard,
          {
            opacity: animValue,
            transform: [{
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => handleViewDetails(don)}
          activeOpacity={0.7}
        >
          <View style={styles.donHeader}>
            <View style={styles.donMainInfo}>
              <Text style={styles.donTitle}>{don.titre || don.repas}</Text>
              <Text style={styles.donQuantity}>{don.quantite}</Text>
            </View>
            {renderStatus(don.status)}
          </View>
          
          <View style={styles.donDetails}>
            <View style={styles.donDetailItem}>
              <FontAwesome5 name="calendar" size={12} color="#666" />
              <Text style={styles.donDate}>Ajouté le: {don.dateAjout}</Text>
            </View>
            <View style={styles.donDetailItem}>
              <FontAwesome5 name="clock" size={12} color="#666" />
              <Text style={styles.donLimite}>Limite: {don.limite}</Text>
            </View>
          </View>
          
          {/* Informations de réservation */}
          {don.status === 'reserved' && don.reservation && (
            <View style={styles.reservationInfo}>
              <View style={styles.reservationHeader}>
                <FontAwesome5 name="hands-helping" size={14} color={colors.orange} />
                <Text style={styles.reservationTitle}>Réservé par:</Text>
              </View>
              <Text style={styles.reservationAssociation}>{don.reservation.association}</Text>
              <Text style={styles.reservationContact}>{don.reservation.contact}</Text>
              <Text style={styles.reservationDate}>Le {don.reservation.dateReservation}</Text>
            </View>
          )}
          
          {/* Actions */}
          {don.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditDon(don)}
              >
                <FontAwesome5 name="edit" size={14} color="#1565C0" />
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteDon(don)}
              >
                <FontAwesome5 name="trash" size={14} color="#C62828" />
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {don.status === 'reserved' && (
            <TouchableOpacity 
              style={styles.collectButton}
              onPress={() => handleMarkAsCollected(don)}
            >
              <FontAwesome5 name="check" size={14} color="white" />
              <Text style={styles.collectButtonText}>Marquer comme collecté</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Header avec statistiques
  const renderHeader = () => (
    <>
      {/* Carte de statistiques */}
      <Animated.View 
        style={[
          styles.statsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.statsTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome5 name="list" size={20} color="#1565C0" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <FontAwesome5 name="clock" size={20} color={colors.green} />
            </View>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF8E1' }]}>
              <FontAwesome5 name="check-circle" size={20} color="#F9A825" />
            </View>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Collectés</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
              <FontAwesome5 name="times-circle" size={20} color="#E53935" />
            </View>
            <Text style={styles.statValue}>{stats.expired}</Text>
            <Text style={styles.statLabel}>Expirés</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Filtres */}
      <Animated.View 
        style={[
          styles.filtersContainer,
          { transform: [{ translateX: filterSlideAnim }] }
        ]}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {[
            { key: 'all', label: 'Tous', icon: 'list' },
            { key: 'active', label: 'Actifs', icon: 'clock' },
            { key: 'completed', label: 'Collectés', icon: 'check-circle' },
            { key: 'expired', label: 'Expirés', icon: 'times-circle' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <FontAwesome5 
                name={filter.icon} 
                size={14} 
                color={selectedFilter === filter.key ? 'white' : '#666'} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'date' ? 'status' : 'date')}
        >
          <FontAwesome5 name="sort" size={16} color={colors.green} />
        </TouchableOpacity>
      </Animated.View>
    </>
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
          <Text style={styles.headerTitle}>Mes dons</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMeal')}
          >
            <FontAwesome5 name="plus" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {sortedDons.length === 0 && !refreshing ? (
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
            <FontAwesome5 name="box-open" size={80} color="#ddd" />
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? "Vous n'avez pas encore ajouté de dons"
                : `Aucun don ${selectedFilter === 'active' ? 'actif' : selectedFilter === 'completed' ? 'collecté' : 'expiré'}`
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddMeal')}
            >
              <FontAwesome5 name="plus-circle" size={18} color="white" />
              <Text style={styles.emptyButtonText}>Ajouter des invendus</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={sortedDons}
          renderItem={renderDon}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.green]}
            />
          }
        />
      )}
      
      {isDeleting && <LoadingOverlay visible={true} text="Suppression..." />}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 10,
    marginBottom: 10,
  },
  filtersScroll: {
    paddingRight: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  donCard: {
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
  donHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donMainInfo: {
    flex: 1,
  },
  donTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  donQuantity: {
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
  donDetails: {
    marginBottom: 12,
  },
  donDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 6,
  },
  donDate: {
    fontSize: 13,
    color: '#666',
  },
  donLimite: {
    fontSize: 13,
    color: '#666',
  },
  reservationInfo: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  reservationTitle: {
    fontWeight: '600',
    color: '#333',
  },
  reservationAssociation: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  reservationContact: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  reservationDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: '#1565C0',
    fontWeight: '500',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: '500',
    fontSize: 14,
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  collectButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EcranMesDons;