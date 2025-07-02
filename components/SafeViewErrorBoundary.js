import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

class SafeViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('SafeViewErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Check if it's a ViewGroup error
    if (error.message && error.message.includes('ViewGroup')) {
      console.warn('ViewGroup error detected, attempting recovery...');
      
      // Clear navigation state and try to recover
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 1000);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    try {
      router.replace('/(root)/(tabs)/home');
    } catch (navError) {
      console.error('Navigation error in error boundary:', navError);
      // Force reload as last resort
      window.location.reload?.();
    }
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a ViewGroup error - if so, show minimal UI and auto-recover
      const isViewGroupError = this.state.error?.message?.includes('ViewGroup') || 
                              this.state.error?.message?.includes('child at index');

      if (isViewGroupError) {
        // Auto-recovery for ViewGroup errors
        setTimeout(() => {
          this.handleReload();
        }, 500);

        return (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: '#000000',
              padding: 20
            }}>
              <View style={{
                backgroundColor: '#1A1A1A',
                padding: 24,
                borderRadius: 16,
                alignItems: 'center',
                maxWidth: 300,
                borderWidth: 1,
                borderColor: '#333333'
              }}>
                <Ionicons name="refresh" size={48} color="#8B5CF6" />
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 18, 
                  fontWeight: '600', 
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  Refreshing...
                </Text>
                <Text style={{ 
                  color: '#A1A1AA', 
                  fontSize: 14, 
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  Optimizing view layout
                </Text>
              </View>
            </View>
          </SafeAreaView>
        );
      }

      // For other errors, show full error UI
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#000000',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#1A1A1A',
              padding: 24,
              borderRadius: 16,
              alignItems: 'center',
              maxWidth: 320,
              borderWidth: 1,
              borderColor: '#333333'
            }}>
              <Ionicons name="warning" size={48} color="#F97316" />
              
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 20, 
                fontWeight: '700', 
                marginTop: 16,
                textAlign: 'center'
              }}>
                Something went wrong
              </Text>
              
              <Text style={{ 
                color: '#A1A1AA', 
                fontSize: 14, 
                marginTop: 8,
                textAlign: 'center',
                lineHeight: 20
              }}>
                Don't worry! This is just a temporary glitch.
              </Text>

              <View style={{ 
                flexDirection: 'row', 
                marginTop: 24,
                gap: 12
              }}>
                <TouchableOpacity
                  onPress={this.handleReload}
                  style={{
                    backgroundColor: '#8B5CF6',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontWeight: '600',
                    fontSize: 14
                  }}>
                    Try Again
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={this.handleGoHome}
                  style={{
                    backgroundColor: '#333333',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="home" size={16} color="#FFFFFF" />
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontWeight: '600',
                    fontSize: 14
                  }}>
                    Go Home
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default SafeViewErrorBoundary; 