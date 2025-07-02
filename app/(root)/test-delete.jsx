import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { deleteUserAccount } from '../../(apis)/user';
import { supabase } from '../../config/supabaseConfig';
import { Fonts } from '../../constants/Fonts';

const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  danger: '#EF4444',
  success: '#10B981',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  cardBg: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.1)',
};

export default function TestDeletePage() {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runConnectivityTests = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Check if user is authenticated
      addTestResult('Authentication Check', !!user, user ? `Logged in as ${user.email}` : 'Not authenticated');

      // Test 2: Check Supabase connection
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        addTestResult('Supabase Connection', !error, error ? error.message : 'Connected successfully');
      } catch (err) {
        addTestResult('Supabase Connection', false, err.message);
      }

      // Test 3: Check session
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        addTestResult('Session Check', !!session && !error, error ? error.message : `Session valid: ${!!session}`);
      } catch (err) {
        addTestResult('Session Check', false, err.message);
      }

      // Test 4: Test Edge Function connectivity (simple call)
      try {
        const { data, error } = await supabase.functions.invoke('smart-service', {
          body: { action: 'test', test: true },
        });
        addTestResult('Edge Function Test', !error, error ? error.message : 'Smart-service function reachable');
      } catch (err) {
        addTestResult('Edge Function Test', false, err.message);
      }

    } catch (error) {
      addTestResult('Test Suite', false, `Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testDeleteFunction = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    Alert.alert(
      'Test Delete Function',
      'This will test the delete function WITHOUT actually deleting your account. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            try {
              setTesting(true);
              
              // Test with confirmDelete = false (should fail gracefully)
              await deleteUserAccount(user.uid, user.email, false);
              addTestResult('Delete Test', false, 'Should have failed but did not');
              
            } catch (error) {
              if (error.message.includes('confirmed')) {
                addTestResult('Delete Test', true, 'Function correctly rejected unconfirmed deletion');
              } else {
                addTestResult('Delete Test', false, `Unexpected error: ${error.message}`);
              }
            } finally {
              setTesting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={{
          fontSize: 18,
          fontFamily: Fonts.GeneralSans.Semibold,
          color: COLORS.text,
        }}>
          Delete Account Debug
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* User Info */}
        <View style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <Text style={{
            fontSize: 16,
            fontFamily: Fonts.GeneralSans.Semibold,
            color: COLORS.text,
            marginBottom: 8,
          }}>
            Current User
          </Text>
          <Text style={{
            fontSize: 14,
            fontFamily: Fonts.GeneralSans.Regular,
            color: COLORS.textSecondary,
          }}>
            Email: {user?.email || 'Not logged in'}
          </Text>
          <Text style={{
            fontSize: 14,
            fontFamily: Fonts.GeneralSans.Regular,
            color: COLORS.textSecondary,
          }}>
            UID: {user?.uid || 'N/A'}
          </Text>
        </View>

        {/* Test Buttons */}
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={runConnectivityTests}
            disabled={testing}
            style={{
              backgroundColor: COLORS.success,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              marginBottom: 12,
              opacity: testing ? 0.5 : 1,
            }}
          >
            <Text style={{
              fontSize: 16,
              fontFamily: Fonts.GeneralSans.Semibold,
              color: '#FFFFFF',
            }}>
              {testing ? 'Running Tests...' : 'Run Connectivity Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={testDeleteFunction}
            disabled={testing || !user}
            style={{
              backgroundColor: COLORS.danger,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              opacity: (testing || !user) ? 0.5 : 1,
            }}
          >
            <Text style={{
              fontSize: 16,
              fontFamily: Fonts.GeneralSans.Semibold,
              color: '#FFFFFF',
            }}>
              Test Delete Function (Safe)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 12,
            padding: 16,
          }}>
            <Text style={{
              fontSize: 16,
              fontFamily: Fonts.GeneralSans.Semibold,
              color: COLORS.text,
              marginBottom: 12,
            }}>
              Test Results
            </Text>
            
            {testResults.map((result, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottomWidth: index < testResults.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.border,
              }}>
                <Ionicons 
                  name={result.success ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={result.success ? COLORS.success : COLORS.danger}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: Fonts.GeneralSans.Medium,
                    color: COLORS.text,
                  }}>
                    {result.test}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.GeneralSans.Regular,
                    color: COLORS.textMuted,
                  }}>
                    {result.message}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontFamily: Fonts.GeneralSans.Regular,
                    color: COLORS.textMuted,
                  }}>
                    {result.timestamp}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
} 