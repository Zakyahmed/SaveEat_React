// ecrans/EcranVerificationProfil.js
import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useJustificatifs } from '../hooks/useJustificatifs';
import JustificatifUploader from '../composants/JustificatifUploader';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../constantes/couleurs';

const EcranVerificationProfil = ({ navigation, route }) => {
  // Récupération des données et fonctions du hook
  const { 
    justificatifs, 
    loading, 
    refreshing, 
    refreshJustificatifs, 
    deleteJustificatif 
  } = useJustificatifs();
  
  // Type d'utilisateur (restaurant/association)
  const userType = route.params?.userType || 'restaurant';
  
  // Rafraîchir les données à chaque fois que l'écran est affiché
  useFocusEffect(
    useCallback(() => {
      refreshJustificatifs();
    }, [refreshJustificatifs])
  );
  
  // Formater la date
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Couleur selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepte':
        return '#4CAF50'; // Vert
      case 'refuse':
        return '#F44336'; // Rouge
      case 'en_attente':
      default:
        return '#FFC107'; // Jaune/Orange
    }
  };
  
  // Texte selon le statut
  const getStatusText = (status) => {
    switch (status) {
      case 'accepte':
        return 'Accepté';
      case 'refuse':
        return 'Refusé';
      case 'en_attente':
      default:
        return 'En attente';
    }
  };
  
  // Gérer la suppression
  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce justificatif ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteJustificatif(id);
            if (success) {
              Alert.alert('Succès', 'Le justificatif a été supprimé');
            }
          }
        },
      ]
    );
  };
  
  // Rendu d'un élément de la liste
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.fileName}>{item.nom_fichier}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
        </View>
      </View>
      
      <Text style={styles.dateText}>Envoyé le {formatDate(item.date_envoi)}</Text>
      
      {item.commentaire && (
        <Text style={styles.commentText}>Commentaire: {item.commentaire}</Text>
      )}
      
      {(item.statut === 'en_attente' || item.statut === 'refuse') && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={styles.deleteText}>Supprimer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Vérifier si un justificatif a été accepté
  const hasAcceptedJustificatif = justificatifs.some(j => j.statut === 'accepte');
  
  // Gestionnaire pour naviguer vers l'écran principal
  const navigateToMain = useCallback(() => {
    if (userType === 'restaurant') {
      navigation.navigate('RestaurantTabs');
    } else {
      navigation.navigate('AssociationTabs');
    }
  }, [navigation, userType]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification du profil</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.container}>
        
        {hasAcceptedJustificatif ? (
          <View style={styles.verifiedContainer}>
            <FontAwesome5 name="checkmark-circle" size={50} color="#4CAF50" />
            <Text style={styles.verifiedText}>Votre profil est vérifié</Text>
            <Text style={styles.verifiedSubText}>
              Vous pouvez maintenant utiliser toutes les fonctionnalités de l'application
            </Text>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={navigateToMain}
            >
              <Text style={styles.continueButtonText}>Continuer vers l'application</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.unverifiedContainer}>
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                {userType === 'restaurant' 
                  ? 'Votre restaurant n\'est pas encore vérifié.'
                  : 'Votre association n\'est pas encore vérifiée.'}
              </Text>
            </View>
            
            <Text style={styles.infoText}>
              Pour que votre profil soit vérifié, veuillez envoyer un justificatif officiel
              {userType === 'restaurant' 
                ? ' de votre activité commerciale (extrait RCS, patente, etc.).'
                : ' de votre association (statuts, attestation d\'inscription au registre, etc.).'}
            </Text>
            
            <JustificatifUploader 
              type={userType} 
              onSuccess={refreshJustificatifs}
            />
          </View>
        )}
        
        <View style={styles.listHeaderContainer}>
          <Text style={styles.listTitle}>Vos justificatifs</Text>
          <Text style={styles.listSubtitle}>
            {justificatifs.length} document{justificatifs.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <FlatList
          data={justificatifs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshJustificatifs}
              colors={['#0066CC']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={50} color="#DDD" />
              <Text style={styles.emptyText}>
                {loading ? 'Chargement...' : 'Aucun justificatif envoyé'}
              </Text>
            </View>
          }
          contentContainerStyle={justificatifs.length === 0 ? { flex: 1 } : null}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  verifiedContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 24,
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
  },
  verifiedSubText: {
    textAlign: 'center',
    color: '#388E3C',
    marginTop: 8,
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  unverifiedContainer: {
    marginBottom: 24,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F57C00',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 16,
    color: '#555',
    lineHeight: 20,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  itemContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DDD',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    color: '#555',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  deleteText: {
    color: '#F44336',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
});

export default EcranVerificationProfil;