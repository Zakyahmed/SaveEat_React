import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../constantes/couleurs';

const Header = ({ 
  title, 
  showBack = false, 
  onBack, 
  style, 
  rightContent,
  backgroundColor = colors.green,
  textColor = 'white'
}) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor }, style]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButtonContainer}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <FontAwesome5 
              name="arrow-left" 
              size={20} 
              color={textColor}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>
      
      <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
      
      <View style={styles.rightContainer}>
        {rightContent || <View style={{ width: 50 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
    height: 80,
  },
  leftContainer: {
    width: 50,
    alignItems: 'flex-start',
  },
  backButtonContainer: {
    padding: 5,
  },
  rightContainer: {
    width: 50,
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    maxWidth: '60%',
  },
});

export default Header;