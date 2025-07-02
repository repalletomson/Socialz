import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/authContext';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { supabase } from '../../config/supabaseConfig';

const COLORS = {
  background: '#000000',
  cardBg: '#111111',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  inputBg: '#1A1A1A',
  accent: '#8B5CF6',
  danger: '#EF4444',
  border: 'rgba(255, 255, 255, 0.1)',
};

const SettingsPage = () => {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { safeBack } = useSafeNavigation({
    modals: [
      () => modalConfig.visible && setModalConfig({ visible: false, title: '', content: '' })
    ],
    onCleanup: () => {
      setModalConfig({ visible: false, title: '', content: '' });
    }
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', content: '' });
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const showModal = (title, content) => {
    setModalConfig({ visible: true, title, content });
  };

  const hideModal = () => {
    setModalConfig({ visible: false, title: '', content: '' });
  };

  const renderSettingItem = ({ icon, title, onPress, value, isSwitch, isLast, isDestructive }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: COLORS.cardBg,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Ionicons 
        name={icon} 
        size={22} 
        color={isDestructive ? COLORS.danger : COLORS.accent} 
      />
      <Text style={{
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: isDestructive ? COLORS.danger : COLORS.text,
        fontWeight: isDestructive ? '600' : '400',
      }}>
        {title}
      </Text>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: '#333', true: `${COLORS.accent}80` }}
          thumbColor={value ? COLORS.accent : '#f4f3f4'}
        />
      ) : (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDestructive ? COLORS.danger : COLORS.textMuted} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingHorizontal: 20,
        paddingBottom: 16,
      }}>
        <TouchableOpacity
          onPress={safeBack}
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
          flex: 1,
          fontSize: 24,
          fontWeight: '700',
          color: COLORS.text,
          marginLeft: 12,
        }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.textMuted,
            marginLeft: 20,
            marginBottom: 8,
          }}>
            Account
          </Text>
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 12,
            marginHorizontal: 16,
            overflow: 'hidden',
          }}>
            {renderSettingItem({
              icon: 'notifications-outline',
              title: 'Notifications',
              onPress: () => setNotificationsEnabled(!notificationsEnabled),
              value: notificationsEnabled,
              isSwitch: true,
            })}
            {renderSettingItem({
              icon: 'shield-checkmark-outline',
              title: 'Privacy',
              onPress: () => showModal('Privacy Settings', 'Configure your privacy preferences here.'),
            })}
            {renderSettingItem({
              icon: 'lock-closed-outline',
              title: 'Security',
              onPress: () => showModal('Security Settings', 'Configure your security preferences here.'),
              isLast: true,
            })}
          </View>
        </View>

        {/* Support Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.textMuted,
            marginLeft: 20,
            marginBottom: 8,
          }}>
            Support
          </Text>
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 12,
            marginHorizontal: 16,
            overflow: 'hidden',
          }}>
            {renderSettingItem({
              icon: 'help-circle-outline',
              title: 'Help & Support',
              onPress: () => showModal('Help & Support', 'Need help? Contact us or view our FAQs.'),
            })}
            {renderSettingItem({
              icon: 'information-circle-outline',
              title: 'About Us',
              onPress: () => showModal('About Us', 'Learn more about our app and team.'),
              isLast: true,
            })}
          </View>
        </View>

        {/* Delete Account Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 12,
            marginHorizontal: 16,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={async () => {
                Alert.alert(
                  'Delete Account',
                  'Are you sure? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('smart-service', {
                            body: {
                              action: 'delete-user',
                              userId: user.uid,
                              userEmail: user.email,
                              confirmDelete: true
                            }
                          });
                          
                          if (error) throw error;
                          if (data?.error) throw new Error(data.error);
                          
                          Alert.alert('Success', 'Account deleted');
                          await logout();
                        } catch (err) {
                          Alert.alert('Error', err.message || 'Failed to delete account');
                        }
                      }
                    }
                  ]
                );
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: COLORS.cardBg,
              }}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              <Text style={{
                flex: 1,
                marginLeft: 16,
                fontSize: 16,
                color: COLORS.danger,
                fontWeight: '600',
              }}>
                Delete Account
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.danger} />
            </TouchableOpacity>

            {renderSettingItem({
              icon: 'log-out-outline',
              title: 'Logout',
              onPress: handleLogout,
              isDestructive: true,
              isLast: true,
            })}
          </View>
        </View>
      </ScrollView>

      {/* Single Modal for all settings */}
      <Modal
        visible={modalConfig.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={hideModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            minHeight: '50%',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <TouchableOpacity onPress={hideModal}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={{
                color: COLORS.text,
                fontSize: 20,
                fontWeight: '600',
                marginLeft: 15,
              }}>
                {modalConfig.title}
              </Text>
            </View>
            
            <View style={{ gap: 16 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
                {modalConfig.content}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default SettingsPage; 