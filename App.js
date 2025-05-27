// App.js - Application principale avec API
import React from 'react';
import { StatusBar } from 'react-native';
import AuthProvider from './context/AuthContext';
import FoodProvider from './context/FoodContext';
import Navigation from './Navigation';
import Toast from './composants/Toast';

export default function App() {
  return (
    <AuthProvider>
      <FoodProvider>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent 
        />
        <Navigation />
        <Toast />
      </FoodProvider>
    </AuthProvider>
  );
}