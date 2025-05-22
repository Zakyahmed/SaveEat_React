import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useJustificatifs } from '../hooks/useJustificatifs';

const JustificatifUploader = ({ type = 'identite', onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const { uploadJustificatif } = useJustificatifs();
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Gestion des permissions pour la caméra
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra pour prendre des photos');
      return false;
    }
    return true;
  };
  
  // Récupérer une image depuis la galerie
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile({
          uri: result.assets[0].uri,
          name: result.assets[0].uri.split('/').pop(),
          type: 'image'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner cette image');
    }
  };
  
  // Prendre une photo avec la caméra
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
          name: 'photo_' + new Date().getTime() + '.jpg',
          type: 'image'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };
  
  // Sélectionner un document (PDF)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setSelectedFile({
          uri: result.uri,
          name: result.name,
          type: 'document'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner ce document');
    }
  };
  
  // Gérer l'upload du fichier
  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner un fichier');
      return;
    }
    
    setUploading(true);
    
    try {
      const result = await uploadJustificatif(selectedFile.uri, type, commentaire);
      
      if (result) {
        Alert.alert('Succès', 'Votre justificatif a été envoyé avec succès');
        
        // Réinitialiser le formulaire
        setSelectedFile(null);
        setCommentaire('');
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setUploading(false);
    }
  };
  
  if (uploading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.uploadingText}>Envoi en cours...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter un justificatif</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Choisir depuis la galerie</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Prendre une photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={pickDocument}>
          <Text style={styles.buttonText}>Sélectionner un PDF</Text>
        </TouchableOpacity>
      </View>
      
      {selectedFile && (
        <View style={styles.filePreview}>
          <Text style={styles.filePreviewText}>
            Fichier sélectionné: {selectedFile.name}
          </Text>
        </View>
      )}
      
      <TextInput
        style={styles.commentInput}
        placeholder="Commentaire (optionnel)"
        value={commentaire}
        onChangeText={setCommentaire}
        multiline={true}
        numberOfLines={3}
      />
      
      <TouchableOpacity 
        style={[styles.uploadButton, !selectedFile && styles.disabledButton]} 
        onPress={handleUpload}
        disabled={!selectedFile}
      >
        <Text style={styles.uploadButtonText}>Envoyer le justificatif</Text>
      </TouchableOpacity>
      
      <Text style={styles.infoText}>
        Formats acceptés: JPG, PNG, PDF. Taille maximale: 10 Mo
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filePreview: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  filePreviewText: {
    fontSize: 14,
  },
  commentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default JustificatifUploader;