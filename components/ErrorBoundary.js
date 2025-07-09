import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: null,
      isAuthError: false,
      isRecovering: false
    };
    this.recoveryTimeoutRef = null;
  }

  static getDerivedStateFromError(error) {
    // Check if it's an auth-related error
    const isAuthError = error?.message?.includes("Cannot read property 'uid' of null") ||
                        error?.message?.includes("Cannot read properties of null") ||
                        error?.message?.includes("Cannot read property 'id' of null") ||
                        error?.message?.includes("user is null") ||
                        error?.message?.includes("user.uid");
    
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorMessage: error.message,
      isAuthError,
      isRecovering: isAuthError
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Handle auth-related errors automatically
    if (this.state.isAuthError) {
      console.log('🔄 Detected auth transition error, attempting auto-recovery...');
      
      // Clear any existing recovery timeout
      if (this.recoveryTimeoutRef) {
        clearTimeout(this.recoveryTimeoutRef);
      }
      
      // Auto-recover from auth transition errors after a short delay
      this.recoveryTimeoutRef = setTimeout(() => {
        console.log('🔄 Auto-recovering from auth error...');
        this.setState({ 
          hasError: false,
          errorMessage: null,
          isAuthError: false,
          isRecovering: false
        });
      }, 1500);
      
      return;
    }
    
    // Log specific errors for better debugging
    if (error.message.includes('hooks') || error.message.includes('Hook')) {
      console.error('React Hooks Error detected - this often happens during navigation or state updates');
    }
    
    if (error.message.includes('childCount') || error.message.includes('ViewGroup')) {
      console.error('Native view hierarchy error detected - this often happens during navigation');
    }
  }

  componentWillUnmount() {
    // Clear timeout on unmount
    if (this.recoveryTimeoutRef) {
      clearTimeout(this.recoveryTimeoutRef);
    }
  }

  handleRetry = () => {
    // Clear any existing recovery timeout
    if (this.recoveryTimeoutRef) {
      clearTimeout(this.recoveryTimeoutRef);
    }
    
    this.setState({ 
      hasError: false,
      errorMessage: null,
      isAuthError: false,
      isRecovering: false
    });
  };

  render() {
    if (this.state.hasError) {
      // Show minimal loading state for auth errors during recovery
      if (this.state.isAuthError && this.state.isRecovering) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>PLease wait !! App is Loading...</Text>
          </View>
        );
      }
      
      // Show full error UI for other errors
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#E53E3E" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.errorMessage || 'An unexpected error occurred. Please try again.'}
          </Text>
          
          {/* Show different messages for auth vs other errors */}
          {this.state.isAuthError ? (
            <Text style={styles.authErrorHint}>
              This appears to be a temporary authentication issue. The app should recover automatically.
            </Text>
          ) : null}
          
          <TouchableOpacity onPress={this.handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  authErrorHint: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 30,
    fontStyle: 'italic',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ErrorBoundary;
