import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/authContext';
import { deleteUserAccount } from '../(apis)/user';
import { Fonts } from '../constants/Fonts';

const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  danger: '#EF4444',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  inputBg: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.1)',
};

export default function DeleteAccountModal({ visible, onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, signOut } = useAuth();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              console.log('🗑️ User confirmed account deletion');

              const result = await deleteUserAccount(user.uid, user.email, true);
              console.log('✅ Deletion successful:', result);

              Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                      signOut(); // Sign out the user
                    }
                  }
                ]
              );

            } catch (error) {
              console.error('❌ Deletion failed:', error);
              
              // Show more specific error messages
              let errorMessage = 'Failed to delete account';
              if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert(
                'Deletion Failed', 
                errorMessage + '\n\nPlease try again or contact support if the problem persists.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: COLORS.background,
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          borderWidth: 1,
          borderColor: COLORS.border
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 20,
              fontFamily: Fonts.GeneralSans.Bold,
              color: COLORS.danger
            }}>
              Delete Account
            </Text>
            
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <View style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.2)'
          }}>
            <Text style={{
              fontSize: 16,
              fontFamily: Fonts.GeneralSans.Semibold,
              color: COLORS.danger,
              marginBottom: 8
            }}>
              ⚠️ Warning
            </Text>
            <Text style={{
              fontSize: 14,
              fontFamily: Fonts.GeneralSans.Regular,
              color: COLORS.textSecondary,
              lineHeight: 20
            }}>
              This will permanently delete your account and all associated data including posts, comments, and streak progress. This action cannot be undone.
            </Text>
          </View>

          {/* User Info */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 14,
              fontFamily: Fonts.GeneralSans.Medium,
              color: COLORS.textMuted,
              marginBottom: 4
            }}>
              Account to delete:
            </Text>
            <Text style={{
              fontSize: 16,
              fontFamily: Fonts.GeneralSans.Semibold,
              color: COLORS.text
            }}>
              {user?.email}
            </Text>
          </View>

          {/* Confirmation Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontFamily: Fonts.GeneralSans.Medium,
              color: COLORS.textMuted,
              marginBottom: 8
            }}>
              Type "DELETE" to confirm:
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE"
              placeholderTextColor={COLORS.textMuted}
              style={{
                backgroundColor: COLORS.inputBg,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                fontFamily: Fonts.GeneralSans.Regular,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.border
              }}
              autoCapitalize="characters"
            />
          </View>

          {/* Actions */}
          <View style={{
            flexDirection: 'row',
            gap: 12
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: COLORS.inputBg,
                borderRadius: 8,
                padding: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontFamily: Fonts.GeneralSans.Semibold,
                color: COLORS.text
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={isDeleting || confirmText !== 'DELETE'}
              style={{
                flex: 1,
                backgroundColor: COLORS.danger,
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                opacity: (isDeleting || confirmText !== 'DELETE') ? 0.5 : 1
              }}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{
                  fontSize: 16,
                  fontFamily: Fonts.GeneralSans.Semibold,
                  color: '#FFFFFF'
                }}>
                  Delete Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 