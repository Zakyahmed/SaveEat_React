import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  TextInput, 
  Alert,
  ScrollView 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../constantes/couleurs';
import { useJustificatifs } from '../hooks/useJustificatifs';

const JustificatifUploader = ({ type = 'identite', onSuccess }) => {
  // États locaux avec useState
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Hook personnalisé
  const { uploadJustificatif } = useJustificatifs();
  
  // Fonction asynchrone pour demander les permissions caméra
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée', 
          'Vous devez autoriser l\'accès à la caméra pour prendre des photos'
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      return false;
    }
  };
  
  // Fonction asynchrone pour sélectionner une image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Mise à jour immutable de l'état
        setSelectedFile({
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner cette image');
    }
  };
  
  // Fonction asynchrone pour prendre une photo
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile({
          uri: result.assets[0].uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };
  
  // Fonction asynchrone pour sélectionner un document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: 'application/pdf'
        });
      }
    } catch (error) {
      console.error('Erreur sélection document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner ce document');
    }
  };
  
  // Fonction asynchrone pour gérer l'upload
  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner un fichier');
      return;
    }
    
    try {
      setUploading(true);
      
      // Appel de la fonction d'upload du hook
      const result = await uploadJustificatif(
        selectedFile.uri, 
        type, 
        commentaire
      );
      
      if (result) {
        // Réinitialiser le formulaire (immutable)
        setSelectedFile(null);
        setCommentaire('');
        
        // Callback de succès (props)
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (error) {
      console.error('Erreur upload:', error);
    } finally {
      setUploading(false);
    }
  };
  
  // Rendu conditionnel si en cours d'upload
  if (uploading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.uploadingText}>Envoi en cours...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>Ajouter un justificatif</Text>
        <Text style={styles.subtitle}>
          {type === 'restaurant' 
            ? 'Document officiel de votre restaurant (extrait RCS, patente, etc.)'
            : type === 'association'
            ? 'Document officiel de votre association (statuts, attestation, etc.)'
            : 'Document d\'identité valide'
          }
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="image" size={20} color="white" />
            <Text style={styles.buttonText}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={takePhoto}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="camera" size={20} color="white" />
            <Text style={styles.buttonText}>Prendre une photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.pdfButton]} 
            onPress={pickDocument}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="file-pdf" size={20} color="white" />
            <Text style={styles.buttonText}>Sélectionner un PDF</Text>
          </TouchableOpacity>
        </View>
        
        {selectedFile && (
          <View style={styles.filePreview}>
            <FontAwesome5 
              name={selectedFile.type === 'application/pdf' ? 'file-pdf' : 'image'} 
              size={24} 
              color={colors.green} 
            />
            <Text style={styles.filePreviewText} numberOfLines={1}>
              {selectedFile.name}
            </Text>
            <TouchableOpacity 
              onPress={() => setSelectedFile(null)}
              style={styles.removeButton}
            >
              <FontAwesome5 name="times" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        
        <TextInput
          style={styles.commentInput}
          placeholder="Commentaire (optionnel)"
          placeholderTextColor="#999"
          value={commentaire}
          onChangeText={setCommentaire}
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={[
            styles.uploadButton, 
            !selectedFile && styles.disabledButton
          ]} 
          onPress={handleUpload}
          disabled={!selectedFile}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="cloud-upload-alt" size={20} color="white" />
          <Text style={styles.uploadButtonText}>Envoyer le justificatif</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          Formats acceptés: JPG, PNG, PDF{'\n'}
          Taille maximale: 10 Mo
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.green,
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfButton: {
    backgroundColor: colors.orange,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  filePreview: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filePreviewText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  commentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 80,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  uploadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default JustificatifUploader;