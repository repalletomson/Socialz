import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Image,
  Modal,
  SafeAreaView,
  Dimensions,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation, router } from 'expo-router';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../config/supabaseConfig';
import { AppText } from '../../_layout';
import networkErrorHandler from '../../../utiles/networkErrorHandler';
import { Fonts, TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import { useFocusEffect } from '@react-navigation/native';

// Consistent Color Palette - WhatsApp-like Black Theme
const COLORS = {
  background: '#000000',
  cardBg: '#111111',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  accent: '#8B5CF6',
  border: '#27272A',
  shadow: 'rgba(0, 0, 0, 0.3)',
  headerBg: '#111111',
  inputBg: '#1A1A1A',
};

const DEFAULT_GROUPS = [
  { id: 'projects', name: 'Higher studies', image: require('../../../assets/images/placements.jpeg') },
  { id: 'movies', name: 'Movies', image: require('../../../assets/images/CINEMA.jpeg') },
  { id: 'funny', name: 'Fest&Events', image: require('../../../assets/images/Events.jpeg') },

  { id: 'placements', name: 'Placement', image: require('../../../assets/images/Placementss.jpeg') },
  { id: 'gaming', name: 'Gaming', image: require('../../../assets/images/Gaming.jpeg') },
  { id: 'coding', name: 'Coding', image: require('../../../assets/images/algoritm.jpeg') },

];

const { width } = Dimensions.get('window');
const SPACING = 10;

export default function GroupList() {
  const { user: currentUser } = useAuthStore();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  // const navigation = useNavigation();

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserGroups();
    }
  }, [currentUser?.id]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchUser = async () => {
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        if (supaUser && isActive) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supaUser.id)
            .single();
          if (data && isActive) {
            // Use this user data for all logic
            // setCurrentUser(data); // or update state as needed
          }
        }
      };
      fetchUser();
      return () => { isActive = false; };
    }, [])
  );

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user groups from Supabase...');
      
      if (!currentUser?.id) {
        console.log('❌ No current user found');
        setLoading(false);
        return;
      }

      // Fetch user's groups from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('groups')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user groups:', error);
        // If user doesn't exist in Supabase, initialize empty groups
        setUserGroups([]);
      } else {
        console.log('✅ User groups fetched from Supabase:', userData?.groups);
        setUserGroups(userData?.groups || []);
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      setUserGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const isUserInGroup = (groupId) => {
    return userGroups.includes(groupId);
  };

  const handleGroupPress = (group) => {
    const isMember = isUserInGroup(group.id);
    
    if (isMember) {
      router.push({
        pathname: '/(root)/groupRoom',
        params: { 
          groupId: group.id,
          groupName: group.name,
          groupImage: JSON.stringify(group.image)
        }
      });
    } else {
      setSelectedGroup(group);
      setJoinModalVisible(true);
    }
  };

  const updateUserGroupsInSupabase = async (groupId) => {
    try {
      setLoading(true);
      console.log('🔄 Updating user groups in Supabase...');
      
      const { error } = await supabase
        .from('users')
        .update({ 
          groups: [...userGroups, groupId]
        })
        .eq('id', currentUser.id);

      if (error) {
        throw error;
      }

      console.log('✅ User groups updated in Supabase');
      return true;
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!currentUser?.id || !selectedGroup) {
      Alert.alert('Error', 'Unable to join group. Please try again.');
      return;
    }

    try {
      setLoading(true);
      console.log(`🚀 Joining group: ${selectedGroup.name}`);

      // 1. Update user's groups in Supabase
      const supabaseSuccess = await updateUserGroupsInSupabase(selectedGroup.id);
      
      if (!supabaseSuccess) {
        Alert.alert('Error', 'Failed to update your profile. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Update Firebase group membership for chat functionality
      try {
        const { joinGroup } = await import('../../../lib/firebase');
        await joinGroup(currentUser.id, selectedGroup.id);
        console.log('✅ Firebase group membership updated');
      } catch (firebaseError) {
        console.warn('⚠️ Firebase group update failed (chat may not work):', firebaseError);
        // Continue anyway as Supabase update succeeded
      }

      // 3. Update local state
      setUserGroups([...userGroups, selectedGroup.id]);
      
      setJoinModalVisible(false);
      
      // 4. Navigate to group room
      router.push({
        pathname: '/(root)/groupRoom',
        params: { 
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
          groupImage: JSON.stringify(selectedGroup.image)
        }
      });

      console.log('✅ Successfully joined group');
      
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const GroupGridItem = ({ item, style }) => (
    <TouchableOpacity 
      onPress={() => handleGroupPress(item)}
      style={{
        width: style.width,
        height: style.height,
        marginBottom: SPACING,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
      }}
    >
      <Image 
        source={item.image} 
        style={{ flex: 1, width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3))',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: 16
        }}
      >
        <AppText style={{ 
          color: COLORS.text, 
          fontSize: 20, 
          fontFamily: Fonts.GeneralSans.Bold,
          marginBottom: 4,
        }}>
          {item.name}
        </AppText>
        {isUserInGroup(item.id) && (
          <View style={{
            backgroundColor: COLORS.accent,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            alignSelf: 'flex-start',
          }}>
            <AppText style={{ 
              color: '#FFFFFF', 
              fontSize: 12,
              fontFamily: Fonts.GeneralSans.Semibold
            }}>
              Member
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const CustomGrid = () => {
    const itemWidth = (width - 3 * SPACING) / 2;
    const largeItemWidth = width - 2 * SPACING;

    return (
      <View style={{ flexDirection: 'column', padding: SPACING }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <GroupGridItem item={DEFAULT_GROUPS[0]} style={{ width: itemWidth, height: 180 }} />
          <GroupGridItem item={DEFAULT_GROUPS[1]} style={{ width: itemWidth, height: 180 }} />
        </View>

        <GroupGridItem item={DEFAULT_GROUPS[2]} style={{ width: largeItemWidth, height: 200 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <GroupGridItem item={DEFAULT_GROUPS[3]} style={{ width: itemWidth, height: 180 }} />
          <GroupGridItem item={DEFAULT_GROUPS[4]} style={{ width: itemWidth, height: 180 }} />
        </View>

        <GroupGridItem item={DEFAULT_GROUPS[5]} style={{ width: largeItemWidth, height: 200 }} />
      </View>
    );
  };

  const JoinGroupModal = () => (
    <Modal 
      animationType="fade" 
      transparent={true} 
      visible={joinModalVisible} 
      onRequestClose={() => setJoinModalVisible(false)}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.8)' 
      }}>
        <View style={{ 
          width: '90%', 
          backgroundColor: COLORS.cardBg,
          borderRadius: 20,
          padding: 24,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 20,
          elevation: 10,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}>
          <AppText style={{ 
            fontSize: 22, 
            fontFamily: Fonts.GeneralSans.Bold, 
            color: COLORS.text, 
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Join {selectedGroup?.name} Group
          </AppText>
          <AppText style={{ 
            color: COLORS.textSecondary, 
            textAlign: 'center', 
            marginBottom: 24,
            fontSize: 15,
            lineHeight: 22,
          }}>
            Disclaimer: This space is for {selectedGroup?.name.toLowerCase()} discussions only. Keep conversations relevant and respectful.
          </AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={() => setJoinModalVisible(false)} 
              style={{ 
                flex: 1, 
                marginRight: 8, 
                padding: 16, 
                borderRadius: 16, 
                backgroundColor: COLORS.inputBg,
                alignItems: 'center',
              }}
            >
              <AppText style={{ 
                color: COLORS.text, 
                fontFamily: Fonts.GeneralSans.Semibold,
                fontSize: 16,
              }}>
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleJoinGroup} 
              style={{ 
                flex: 1, 
                marginLeft: 8, 
                padding: 16, 
                borderRadius: 16, 
                backgroundColor: COLORS.accent,
                alignItems: 'center',
              }}
            >
              <AppText style={TextStyles.body}>
                Join Group
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: COLORS.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={{ fontSize: scaleSize(32), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 2, letterSpacing: -1 }}>social</Text>
            <Text style={{ fontSize: scaleSize(44), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Bold, letterSpacing: -2 }}>z.</Text>
          </View>
          <Text style={{ color: '#A1A1AA', fontSize: scaleSize(18), marginTop: 8, fontFamily: Fonts.GeneralSans.Medium }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
      }}>
        <AppText style={TextStyles.h1}>
          Spaces
        </AppText>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <CustomGrid />
      </ScrollView>

      <JoinGroupModal />
    </SafeAreaView>
  );
};

