// ecrans/EcranRestaurant.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { useAuth } from '../context/AuthContext';
import { useFood } from '../context/FoodContext';
import { FontAwesome5 } from '@expo/vector-icons';
import Card from '../composants/Card';
import LoadingOverlay from '../composants/LoadingOverlay';

const { width } = Dimensions.get('window');

const EcranRestaurant = ({ navigation }) => {
  // États
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' ou 'history'
  
  // Contextes
  const { user } = useAuth();
  const { invendus, reservations, getRestaurantStats } = useFood();
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const statsAnimation = useState(new Animated.Value(0))[0];
  
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
      Animated.spring(statsAnimation, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Récupération des statistiques
  const stats = getRestaurantStats();
  
  // Filtrer les dons actifs et l'historique
  const activeDons = invendus.filter(don => 
    don.restaurantId === user?.id && 
    (don.status === 'pending' || don.status === 'reserved')
  );
  
  const historyDons = invendus.filter(don => 
    don.restaurantId === user?.id && 
    (don.status === 'completed' || don.status === 'expired')
  );
  
  // Gestionnaire de rafraîchissement
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simuler un rafraîchissement
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);
  
  // Gestionnaire pour ajouter des invendus
  const handleAddMeal = () => {
    navigation.navigate('AddMeal');
  };
  
  // Gestionnaire pour voir les détails d'un don
  const handleDonationPress = (donation) => {
    navigation.navigate('DetailDonRestaurant', { id: donation.id });
  };
  
  // Gestionnaire pour voir toutes les réservations
  const handleViewAllReservations = () => {
    navigation.navigate('MesDons');
  };
  
  // Rendu du statut d'un don
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
  
  // Rendu d'une carte de donation
  const renderDonationCard = (donation) => {
    const reservation = reservations.find(r => r.invenduId === donation.id);
    
    return (
      <TouchableOpacity
        key={donation.id}
        style={styles.donationCard}
        onPress={() => handleDonationPress(donation)}
        activeOpacity={0.7}
      >
        <View style={styles.donationHeader}>
          <View style={styles.donationInfo}>
            <Text style={styles.donationTitle}>{donation.titre || donation.repas}</Text>
            <Text style={styles.donationQuantity}>{donation.quantite}</Text>
          </View>
          <View style={styles.donationMeta}>
            {renderStatus(donation.status)}
            <Text style={styles.donationTime}>
              <FontAwesome5 name="clock" size={12} color="#666" /> {donation.limite}
            </Text>
          </View>
        </View>
        
        {donation.status === 'reserved' && reservation && (
          <View style={styles.reservationInfo}>
            <FontAwesome5 name="hands-helping" size={14} color={colors.orange} />
            <Text style={styles.reservationText}>
              Réservé par: {reservation.associationName}
            </Text>
          </View>
        )}
        
        {donation.isUrgent && (
          <View style={styles.urgentBadge}>
            <FontAwesome5 name="exclamation-circle" size={12} color="white" />
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SaveEat</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => console.log('Notifications')}
        >
          <FontAwesome5 name="bell" size={20} color={colors.green} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.green]}
          />
        }
      >
        {/* Message de bienvenue */}
        <Animated.View 
          style={[
            styles.welcomeSection,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.greeting}>
            Bonjour, {user?.name || 'Restaurant'} !
          </Text>
          <Text style={styles.subtitle}>
            Partagez vos invendus avec ceux qui en ont besoin
          </Text>
        </Animated.View>
        
        {/* Bouton d'ajout d'invendus */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddMeal}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="plus-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Ajouter des invendus</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Statistiques */}
        <Animated.View 
          style={[
            styles.statsCard,
            {
              opacity: statsAnimation,
              transform: [{ scale: statsAnimation }]
            }
          ]}
        >
          <Text style={styles.cardTitle}>Impact de vos dons</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <FontAwesome5 name="utensils" size={24} color={colors.green} />
              <Text style={[styles.statValue, { color: colors.green }]}>
                {stats.repasSauves}
              </Text>
              <Text style={styles.statLabel}>Repas sauvés</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <FontAwesome5 name="hands-helping" size={24} color={colors.orange} />
              <Text style={[styles.statValue, { color: colors.orange }]}>
                {stats.associationsAidees}
              </Text>
              <Text style={styles.statLabel}>Assoc. aidées</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <FontAwesome5 name="leaf" size={24} color={colors.green} />
              <Text style={[styles.statValue, { color: colors.green }]}>
                {stats.co2Economise}kg
              </Text>
              <Text style={styles.statLabel}>CO₂ économisé</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Tabs pour dons actifs/historique */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Dons actifs ({activeDons.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Historique ({historyDons.length})
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Liste des dons */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === 'active' ? (
            <>
              {activeDons.length > 0 ? (
                <>
                  {activeDons.map(renderDonationCard)}
                  
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={handleViewAllReservations}
                  >
                    <Text style={styles.viewAllText}>Voir toutes les réservations</Text>
                    <FontAwesome5 name="arrow-right" size={14} color={colors.green} />
                  </TouchableOpacity>
                </>
              ) : (
                <Card style={styles.emptyCard}>
                  <FontAwesome5 name="box-open" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>Aucun don actif</Text>
                  <Text style={styles.emptySubText}>
                    Commencez par ajouter des invendus
                  </Text>
                </Card>
              )}
            </>
          ) : (
            <>
              {historyDons.length > 0 ? (
                historyDons.map(renderDonationCard)
              ) : (
                <Card style={styles.emptyCard}>
                  <FontAwesome5 name="history" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>Aucun historique</Text>
                  <Text style={styles.emptySubText}>
                    Vos dons passés apparaîtront ici
                  </Text>
                </Card>
              )}
            </>
          )}
        </Animated.View>
        
        {/* Carte d'information */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FontAwesome5 name="lightbulb" size={20} color={colors.orange} />
            <Text style={styles.infoTitle}>Le saviez-vous ?</Text>
          </View>
          <Text style={styles.infoText}>
            En moyenne, un restaurant peut sauver jusqu'à 1000 repas par an grâce à SaveEat !
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.green,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
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
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#eee',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.green,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  donationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donationInfo: {
    flex: 1,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  donationQuantity: {
    fontSize: 14,
    color: '#666',
  },
  donationMeta: {
    alignItems: 'flex-end',
  },
  donationTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
  reservationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  reservationText: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '500',
  },
  urgentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
    gap: 8,
  },
  viewAllText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#FFF8E1',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default EcranRestaurant;