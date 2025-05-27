// ecrans/EcranAjoutInvendu.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Switch, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { colors } from '../constantes/couleurs';
import { globalStyles } from '../theme/styles';
import Header from '../composants/Header';
import Button from '../composants/Button';
import Card from '../composants/Card';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFood } from '../context/FoodContext';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const EcranAjoutInvendu = ({ navigation }) => {
  // Contextes
  const { addInvendu } = useFood();
  const { user } = useAuth();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    titre: '',
    quantite: '',
    unite: 'portions',
    description: '',
    date: new Date(),
    heure: new Date(),
    isUrgent: false,
    allergenes: [],
    temperature: 'ambient',
    instructions: '',
    image: null,
    categories: []
  });
  
  // États UI
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0.33)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Options prédéfinies
  const uniteOptions = ['portions', 'kg', 'litres', 'pièces'];
  const temperatureOptions = [
    { value: 'ambient', label: 'Ambiante', icon: 'temperature-low' },
    { value: 'refrigerated', label: 'Réfrigéré', icon: 'snowflake' },
    { value: 'frozen', label: 'Congelé', icon: 'icicles' }
  ];
  const allergenesOptions = [
    'Gluten', 'Lactose', 'Œufs', 'Arachides', 'Soja', 
    'Fruits à coque', 'Céleri', 'Moutarde', 'Sésame', 'Poisson',
    'Crustacés', 'Mollusques', 'Lupin', 'Sulfites'
  ];
  const categoriesOptions = [
    { value: 'plats', label: 'Plats cuisinés', icon: 'utensils' },
    { value: 'salades', label: 'Salades', icon: 'leaf' },
    { value: 'sandwichs', label: 'Sandwichs', icon: 'bread-slice' },
    { value: 'desserts', label: 'Desserts', icon: 'ice-cream' },
    { value: 'boissons', label: 'Boissons', icon: 'glass-water' },
    { value: 'viennoiseries', label: 'Viennoiseries', icon: 'croissant' },
    { value: 'autres', label: 'Autres', icon: 'box' }
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
  }, []);
  
  // Animation de progression
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: currentStep / 3,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);
  
  // Mise à jour du formulaire
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Sélectionner une image
  const selectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de votre permission pour accéder à votre galerie.'
      );
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      updateFormData('image', result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Prendre une photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de votre permission pour accéder à votre caméra.'
      );
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      updateFormData('image', result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Validation par étape
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.titre.trim()) {
          newErrors.titre = 'Le titre est requis';
        }
        if (!formData.quantite) {
          newErrors.quantite = 'La quantité est requise';
        } else if (isNaN(formData.quantite) || parseFloat(formData.quantite) <= 0) {
          newErrors.quantite = 'La quantité doit être un nombre positif';
        }
        if (formData.categories.length === 0) {
          newErrors.categories = 'Sélectionnez au moins une catégorie';
        }
        break;
        
      case 2:
        const now = new Date();
        const deadline = new Date(formData.date);
        deadline.setHours(formData.heure.getHours());
        deadline.setMinutes(formData.heure.getMinutes());
        
        if (deadline <= now) {
          newErrors.date = 'La date et l\'heure doivent être dans le futur';
        }
        break;
        
      case 3:
        // Validation optionnelle pour l'étape 3
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigation entre étapes
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        handleSubmit();
      }
    }
  };
  
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Formater les données
      const deadline = new Date(formData.date);
      deadline.setHours(formData.heure.getHours());
      deadline.setMinutes(formData.heure.getMinutes());
      
      const invenduData = {
        titre: formData.titre,
        repas: formData.titre,
        quantite: `${formData.quantite} ${formData.unite}`,
        description: formData.description,
        limite: deadline.toISOString(),
        isUrgent: formData.isUrgent,
        allergenes: formData.allergenes.join(', '),
        temperature: formData.temperature,
        instructions: formData.instructions,
        image: formData.image,
        categories: formData.categories,
        restaurantId: user?.id,
        restaurant: user?.name || 'Restaurant'
      };
      
      await addInvendu(invenduData);
      
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Succès !',
          'Votre offre a été publiée avec succès.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('RestaurantTabs')
            }
          ]
        );
      });
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la publication.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rendu de l'étape 1
  const renderStep1 = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.stepTitle}>Informations de base</Text>
      
      {/* Titre */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Titre de l'offre</Text>
        <View style={[
          styles.inputWrapper,
          errors.titre && styles.inputError
        ]}>
          <FontAwesome5 name="tag" size={18} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={formData.titre}
            onChangeText={(text) => updateFormData('titre', text)}
            placeholder="Ex: Salades fraîches du jour"
            placeholderTextColor="#999"
          />
        </View>
        {errors.titre && <Text style={styles.errorText}>{errors.titre}</Text>}
      </View>
      
      {/* Quantité et unité */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Quantité disponible</Text>
        <View style={styles.quantityContainer}>
          <View style={[
            styles.quantityInputWrapper,
            errors.quantite && styles.inputError
          ]}>
            <TextInput
              style={styles.quantityInput}
              value={formData.quantite}
              onChangeText={(text) => updateFormData('quantite', text)}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.uniteScroll}
          >
            {uniteOptions.map(unite => (
              <TouchableOpacity
                key={unite}
                style={[
                  styles.uniteButton,
                  formData.unite === unite && styles.uniteButtonActive
                ]}
                onPress={() => updateFormData('unite', unite)}
              >
                <Text style={[
                  styles.uniteButtonText,
                  formData.unite === unite && styles.uniteButtonTextActive
                ]}>
                  {unite}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {errors.quantite && <Text style={styles.errorText}>{errors.quantite}</Text>}
      </View>
      
      {/* Catégories */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Catégories</Text>
        <View style={styles.categoriesGrid}>
          {categoriesOptions.map(category => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryButton,
                formData.categories.includes(category.value) && styles.categoryButtonActive
              ]}
              onPress={() => {
                const newCategories = formData.categories.includes(category.value)
                  ? formData.categories.filter(c => c !== category.value)
                  : [...formData.categories, category.value];
                updateFormData('categories', newCategories);
                Haptics.selectionAsync();
              }}
            >
              <FontAwesome5 
                name={category.icon} 
                size={20} 
                color={formData.categories.includes(category.value) ? 'white' : '#666'} 
              />
              <Text style={[
                styles.categoryButtonText,
                formData.categories.includes(category.value) && styles.categoryButtonTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.categories && <Text style={styles.errorText}>{errors.categories}</Text>}
      </View>
      
      {/* Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description (optionnel)</Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textarea}
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            placeholder="Décrivez vos produits..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </Animated.View>
  );
  
  // Rendu de l'étape 2
  const renderStep2 = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.stepTitle}>Date et heure limite</Text>
      
      {/* Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date limite de récupération</Text>
        <TouchableOpacity 
          style={[
            styles.dateButton,
            errors.date && styles.inputError
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <FontAwesome5 name="calendar-alt" size={18} color={colors.green} />
          <Text style={styles.dateButtonText}>
            {formData.date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </TouchableOpacity>
        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
      </View>
      
      {/* Heure */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Heure limite</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <FontAwesome5 name="clock" size={18} color={colors.green} />
          <Text style={styles.dateButtonText}>
            {formData.heure.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Option Urgent */}
      <View style={styles.urgentContainer}>
        <View style={styles.urgentInfo}>
          <FontAwesome5 name="exclamation-circle" size={20} color={colors.orange} />
          <View style={styles.urgentTextContainer}>
            <Text style={styles.urgentTitle}>Marquer comme urgent</Text>
            <Text style={styles.urgentDescription}>
              Pour les produits à consommer dans les 4 prochaines heures
            </Text>
          </View>
        </View>
        <Switch
          trackColor={{ false: "#ddd", true: colors.orange }}
          thumbColor="white"
          onValueChange={(value) => {
            updateFormData('isUrgent', value);
            if (value) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }}
          value={formData.isUrgent}
        />
      </View>
      
      {/* Aperçu du temps restant */}
      <Card style={styles.timePreview}>
        <Text style={styles.timePreviewTitle}>Temps restant après publication :</Text>
        <Text style={styles.timePreviewValue}>
          {(() => {
            const now = new Date();
            const deadline = new Date(formData.date);
            deadline.setHours(formData.heure.getHours());
            deadline.setMinutes(formData.heure.getMinutes());
            const diff = deadline - now;
            
            if (diff <= 0) return "Date passée";
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours}h ${minutes}min`;
          })()}
        </Text>
      </Card>
    </Animated.View>
  );
  
  // Rendu de l'étape 3
  const renderStep3 = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.stepTitle}>Informations complémentaires</Text>
      
      {/* Photo */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Photo du produit (optionnel)</Text>
        <View style={styles.imageSection}>
          {formData.image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: formData.image }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => updateFormData('image', null)}
              >
                <FontAwesome5 name="times" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <FontAwesome5 name="camera" size={20} color={colors.green} />
                <Text style={styles.imageButtonText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
                <FontAwesome5 name="image" size={20} color={colors.green} />
                <Text style={styles.imageButtonText}>Choisir une photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {/* Allergènes */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Allergènes présents</Text>
        <View style={styles.allergenesGrid}>
          {allergenesOptions.map(allergene => (
            <TouchableOpacity
              key={allergene}
              style={[
                styles.allergeneButton,
                formData.allergenes.includes(allergene) && styles.allergeneButtonActive
              ]}
              onPress={() => {
                const newAllergenes = formData.allergenes.includes(allergene)
                  ? formData.allergenes.filter(a => a !== allergene)
                  : [...formData.allergenes, allergene];
                updateFormData('allergenes', newAllergenes);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[
                styles.allergeneButtonText,
                formData.allergenes.includes(allergene) && styles.allergeneButtonTextActive
              ]}>
                {allergene}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Température de conservation */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Conservation</Text>
        <View style={styles.temperatureOptions}>
          {temperatureOptions.map(temp => (
            <TouchableOpacity
              key={temp.value}
              style={[
                styles.temperatureButton,
                formData.temperature === temp.value && styles.temperatureButtonActive
              ]}
              onPress={() => updateFormData('temperature', temp.value)}
            >
              <FontAwesome5 
                name={temp.icon} 
                size={24} 
                color={formData.temperature === temp.value ? 'white' : colors.green} 
              />
              <Text style={[
                styles.temperatureButtonText,
                formData.temperature === temp.value && styles.temperatureButtonTextActive
              ]}>
                {temp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Instructions */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Instructions de récupération (optionnel)</Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textarea}
            value={formData.instructions}
            onChangeText={(text) => updateFormData('instructions', text)}
            placeholder="Ex: Demander à l'accueil, apporter ses contenants..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: 'white' }]}>
      <StatusBar barStyle="dark-content" />
      
      <Header 
        title="Ajouter un invendu"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      {/* Barre de progression */}
      <View style={styles.progressContainer}>
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
        <View style={styles.progressSteps}>
          {[1, 2, 3].map(step => (
            <View 
              key={step}
              style={[
                styles.progressStep,
                currentStep >= step && styles.progressStepActive
              ]}
            >
              <Text style={[
                styles.progressStepText,
                currentStep >= step && styles.progressStepTextActive
              ]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Boutons de navigation */}
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={previousStep}
          >
            <FontAwesome5 name="arrow-left" size={16} color={colors.green} />
            <Text style={styles.previousButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            { flex: currentStep > 1 ? 1 : undefined }
          ]}
          onPress={nextStep}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'Publier' : 'Suivant'}
              </Text>
              <FontAwesome5 
                name={currentStep === 3 ? 'check' : 'arrow-right'} 
                size={16} 
                color="white" 
              />
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              updateFormData('date', selectedDate);
            }
          }}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={formData.heure}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              updateFormData('heure', selectedTime);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -18,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: colors.green,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  progressStepTextActive: {
    color: 'white',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
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
  inputError: {
    borderColor: '#f44336',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInputWrapper: {
    width: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#f9f9f9',
  },
  quantityInput: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  uniteScroll: {
    flex: 1,
  },
  uniteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  uniteButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  uniteButtonText: {
    fontSize: 14,
    color: '#666',
  },
  uniteButtonTextActive: {
    color: 'white',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    width: (width - 50) / 3,
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  textareaWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  textarea: {
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#f9f9f9',
    gap: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  urgentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  urgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  urgentTextContainer: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  urgentDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timePreview: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    alignItems: 'center',
  },
  timePreviewTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timePreviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.green,
  },
  imageSection: {
    marginTop: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageButtonText: {
    fontSize: 14,
    color: colors.green,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergeneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  allergeneButtonActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  allergeneButtonText: {
    fontSize: 12,
    color: '#666',
  },
  allergeneButtonTextActive: {
    color: 'white',
  },
  temperatureOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  temperatureButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  temperatureButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  temperatureButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  temperatureButtonTextActive: {
    color: 'white',
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.green,
    gap: 8,
  },
  previousButtonText: {
    color: colors.green,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8,
    minWidth: 120,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EcranAjoutInvendu;