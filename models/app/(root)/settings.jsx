import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { supabase } from '../../config/supabaseConfig';
import { TextStyles } from '../../constants/Fonts';
import { scaleSize, verticalScale } from '../../utiles/common';
import registerForPushNotificationsAsync from '../../(apis)/notifications';

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
  const { user, isAuthenticated, logout } = useAuthStore();
  const { safeBack } = useSafeNavigation({
    modals: [
      () => modalConfig.visible && setModalConfig({ visible: false, title: '', content: '' })
    ],
    onCleanup: () => {
      setModalConfig({ visible: false, title: '', content: '' });
    }
  });
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', content: '' });
  const [deleting, setDeleting] = useState(false);

  if (!isAuthenticated || !user?.id) {
    return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Loading...</Text></View>;
  }

  useEffect(() => {
    const fetchNotificationPref = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setNotificationsEnabled(data.notifications_enabled !== false);
      }
    };
    fetchNotificationPref();
  }, [user?.id]);

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
        paddingVertical: verticalScale(16),
        paddingHorizontal: scaleSize(20),
        backgroundColor: COLORS.cardBg,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Ionicons 
        name={icon} 
        size={scaleSize(22)} 
        color={isDestructive ? COLORS.danger : COLORS.accent} 
      />
      <Text style={{
        flex: 1,
        marginLeft: scaleSize(16),
        fontSize: scaleSize(16),
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
          size={scaleSize(20)} 
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
        paddingTop: Platform.OS === 'ios' ? scaleSize(50) : scaleSize(40),
        paddingHorizontal: scaleSize(20),
        paddingBottom: scaleSize(16),
      }}>
        <TouchableOpacity
          onPress={safeBack}
          style={{
            width: scaleSize(40),
            height: scaleSize(40),
            borderRadius: scaleSize(20),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={scaleSize(24)} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          fontSize: scaleSize(24),
          fontWeight: '700',
          color: COLORS.text,
          marginLeft: scaleSize(12),
        }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={{ marginBottom: scaleSize(24) }}>
          <Text style={[TextStyles.h2, { marginLeft: scaleSize(16), marginBottom: scaleSize(8) }]}>
            Account
          </Text>
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: scaleSize(12),
            marginHorizontal: scaleSize(16),
            overflow: 'hidden',
          }}>
            {renderSettingItem({
              icon: 'notifications-outline',
              title: 'Push Notification Settings',
              onPress: () => {
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  Linking.openSettings();
                }
              },
              isSwitch: false,
            })}
            {renderSettingItem({
              icon: 'shield-checkmark-outline',
              title: 'Privacy Policy',
              onPress: () => Linking.openURL('https://docs.google.com/document/d/1LErFNXd7xi3XnDKUPsFTI8pxrVhtZfVwp2EYOlVn7dw/edit?tab=t.0'),
            })}
           
          </View>
        </View>

        {/* Support Section */}
        <View style={{ marginBottom: scaleSize(24) }}>
          <Text style={[TextStyles.h2, { marginLeft: scaleSize(16), marginBottom: scaleSize(8) }]}>
            Support
          </Text>
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: scaleSize(12),
            marginHorizontal: scaleSize(16),
            overflow: 'hidden',
          }}>
            {renderSettingItem({
              icon: 'help-circle-outline',
              title: 'Help & Support',
              onPress: () => showModal('Help & Support',
                `If you have any questions, concerns, or requests regarding the app, including personal data, technical issues, or feature suggestions, feel free to contact at vinoothnaaadhya@gmail.com. Whether you're experiencing a bug, need help navigating the app, or want to share feedback or request new features, we're here to help and typically respond within 24–48 hours.`),
            })}
            {renderSettingItem({
              icon: 'information-circle-outline',
              title: 'About Us',
              onPress: () => showModal('About Us',
                `SocialZ is a modern social platform designed to connect students and young professionals. Our mission is to foster meaningful connections, provide a safe space for sharing, and empower users to express themselves freely.\n\nFor more information, feedback, or partnership inquiries, contact us at vinoothnaaadhya@gmail.com.`),
              isLast: true,
            })}
          </View>
        </View>

        {/* Delete Account Section */}
        <View style={{ marginBottom: scaleSize(24) }}>
          <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: scaleSize(12),
            marginHorizontal: scaleSize(16),
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
                              userId: user.id,
                              userEmail: user.email,
                              confirmDelete: true
                            }
                          });
                          
                          if (error) throw error;
                          if (data?.error) throw new Error(data.error);
                          
                          Alert.alert('Success', 'Account deleted');
                          await logout();
                          router.replace('/(auth)/auth');
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
                paddingVertical: verticalScale(16),
                paddingHorizontal: scaleSize(20),
                backgroundColor: COLORS.cardBg,
              }}
            >
              <Ionicons name="trash-outline" size={scaleSize(22)} color={COLORS.danger} />
              <Text style={{
                flex: 1,
                marginLeft: scaleSize(16),
                fontSize: scaleSize(16),
                color: COLORS.danger,
                fontWeight: '600',
              }}>
                Delete Account
              </Text>
              <Ionicons name="chevron-forward" size={scaleSize(20)} color={COLORS.danger} />
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
            borderTopLeftRadius: scaleSize(24),
            borderTopRightRadius: scaleSize(24),
            padding: scaleSize(20),
            minHeight: scaleSize('50%'),
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: scaleSize(20),
            }}>
              <TouchableOpacity onPress={hideModal}>
                <Ionicons name="close" size={scaleSize(24)} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={{
                color: COLORS.text,
                fontSize: scaleSize(20),
                fontWeight: '600',
                marginLeft: scaleSize(15),
              }}>
                {modalConfig.title}
              </Text>
            </View>
            
            <View style={{ gap: scaleSize(16) }}>
              <Text style={TextStyles.body1}>
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