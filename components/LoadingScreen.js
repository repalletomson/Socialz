import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Socialz</Text>
      <Text style={styles.loading}>{message}</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: -1,
  },
  loading: {
    color: '#888',
    fontSize: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
}); 