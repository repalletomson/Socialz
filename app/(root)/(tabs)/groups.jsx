import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, router } from 'expo-router';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../config/supabaseConfig';
import { AppText } from '../../_layout';
import networkErrorHandler from '../../../utiles/networkErrorHandler';
import { Fonts, TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SPACING = 10;

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

export default function GroupList() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const navigation = useNavigation();
  const isMounted = useRef(true);

  const fetchUserGroups = useCallback(async (user) => {
    if (!user?.id) {
      setUserGroups([]);
      return;
    }
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('groups')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setUserGroups(userData?.groups || []);
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      setUserGroups([]);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: supaUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (supaUser?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supaUser.id)
          .single();
        if (error) throw error;
        if (isMounted.current) {
          setCurrentUser(data);
          await fetchUserGroups(data);
        }
      } else {
        setCurrentUser(null);
        setUserGroups([]);
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
    } finally {
      setLoading(false);
    }
  }, [fetchUserGroups]);

  useEffect(() => {
    isMounted.current = true;
    fetchUser();
    return () => {
      isMounted.current = false;
    };
  }, [fetchUser]);

  useFocusEffect(
    useCallback(() => {
      // Refresh user groups when screen comes into focus
      if (currentUser?.id) {
        fetchUserGroups(currentUser);
      }
      
      let subscription;
      if (currentUser?.id) {
        subscription = supabase
          .channel('user-groups-channel')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${currentUser.id}`,
            },
            (payload) => {
              if (isMounted.current && payload.new?.groups) {
                setUserGroups(payload.new.groups || []);
              }
            }
          )
          .subscribe();
      }
      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }, [currentUser?.id, fetchUserGroups])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, [fetchUser]);

  const isUserInGroup = useCallback((groupId) => {
    return userGroups.includes(groupId);
  }, [userGroups]);

  const handleGroupPress = (group) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to join or access groups.');
      return;
    }
    
    if (isUserInGroup(group.id)) {
      // User is already a member - go directly to groupRoom
      router.push({
        pathname: '/(root)/groupRoom',
        params: {
          groupId: group.id,
          groupName: group.name,
          groupImage: JSON.stringify(group.image),
          userGroups: JSON.stringify(userGroups),
          userId: currentUser.id,
        },
      });
    } else {
      // User is not a member - show join modal
      setSelectedGroup(group);
      setJoinModalVisible(true);
    }
  };

  const updateUserGroupsInSupabase = async (groupId, action) => {
    try {
      const newGroups = action === 'join'
        ? [...userGroups, groupId]
        : userGroups.filter((id) => id !== groupId);
      const { error } = await supabase
        .from('users')
        .update({ groups: newGroups })
        .eq('id', currentUser.id);
      if (error) throw error;
      return newGroups;
    } catch (error) {
      throw error;
    }
  };

  const handleJoinGroup = async () => {
    if (!currentUser?.id || !selectedGroup) {
      Alert.alert('Error', 'Unable to join group. Please try again.');
      return;
    }
    setJoiningGroup(true);
    try {
      const updatedGroups = await updateUserGroupsInSupabase(selectedGroup.id, 'join');
      try {
        const { joinGroup } = await import('../../../lib/firebase');
        await joinGroup(currentUser.id, selectedGroup.id);
      } catch (firebaseError) {
        console.warn('Firebase group update failed:', firebaseError);
      }
      if (isMounted.current) {
        setUserGroups(updatedGroups);
        setCurrentUser({ ...currentUser, groups: updatedGroups });
        setJoinModalVisible(false);
        setSelectedGroup(null);
        router.push({
          pathname: '/(root)/groupRoom',
          params: {
            groupId: selectedGroup.id,
            groupName: selectedGroup.name,
            groupImage: JSON.stringify(selectedGroup.image),
            userGroups: JSON.stringify(updatedGroups),
            userId: currentUser.id,
          },
        });
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setJoiningGroup(false);
    }
  };

  {/* handleLeaveGroup removed - leave functionality moved to groupRoom */}

  const GroupGridItem = ({ item, style }) => (
    <Animated.View entering={FadeInUp.delay(100 * DEFAULT_GROUPS.indexOf(item)).duration(300)}>
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
          shadowOpacity: 0.5,
          shadowRadius: 10,
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
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 16,
          }}
        >
          <AppText
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontFamily: Fonts.GeneralSans.Bold,
              marginBottom: 4,
            }}
          >
            {item.name}
          </AppText>
          {isUserInGroup(item.id) && (
            <View
              style={{
                backgroundColor: COLORS.accent,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                alignSelf: 'flex-start',
                marginTop: 6,
              }}
            >
              <AppText
                style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontFamily: Fonts.GeneralSans.Semibold,
                }}
              >
                Member
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
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
      onRequestClose={() => !joiningGroup && setJoinModalVisible(false)}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
        }}
      >
        <View
          style={{
            width: '90%',
            backgroundColor: COLORS.cardBg,
            borderRadius: 20,
            padding: 24,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <AppText
            style={{
              fontSize: 22,
              fontFamily: Fonts.GeneralSans.Bold,
              color: COLORS.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Join {selectedGroup?.name} Group
          </AppText>
          <AppText
            style={{
              color: COLORS.textSecondary,
              textAlign: 'center',
              marginBottom: 24,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            Disclaimer: This space is for {selectedGroup?.name.toLowerCase()} discussions only. Keep conversations relevant and respectful.
          </AppText>
          {joiningGroup && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <ActivityIndicator color={COLORS.accent} size="small" />
              <AppText
                style={{
                  color: COLORS.textSecondary,
                  marginLeft: 8,
                  fontSize: 14,
                }}
              >
                Joining group...
              </AppText>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => !joiningGroup && setJoinModalVisible(false)}
              style={{
                flex: 1,
                marginRight: 8,
                padding: 16,
                borderRadius: 16,
                backgroundColor: COLORS.inputBg,
                alignItems: 'center',
                opacity: joiningGroup ? 0.5 : 1,
              }}
              disabled={joiningGroup}
            >
              <AppText
                style={{
                  color: COLORS.text,
                  fontFamily: Fonts.GeneralSans.Semibold,
                  fontSize: 16,
                }}
              >
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
                opacity: joiningGroup ? 0.5 : 1,
              }}
              disabled={joiningGroup}
            >
              <AppText style={{ color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Semibold, fontSize: 16 }}>
                {joiningGroup ? 'Joining...' : 'Join Group'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  {/* LeaveGroupModal removed - leave functionality moved to groupRoom */}

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: scaleSize(32),
                color: '#FFFFFF',
                fontFamily: Fonts.GeneralSans.Medium,
                marginRight: 2,
                letterSpacing: -1,
              }}
            >
              social
            </Text>
            <Text
              style={{
                fontSize: scaleSize(44),
                color: '#FFFFFF',
                fontFamily: Fonts.GeneralSans.Bold,
                letterSpacing: -2,
              }}
            >
              z.
            </Text>
          </View>
          <Text
            style={{
              color: '#A1A1AA',
              fontSize: scaleSize(18),
              marginTop: 8,
              fontFamily: Fonts.GeneralSans.Medium,
            }}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          alignItems: 'center',
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <AppText style={TextStyles.h1}>Spaces</AppText>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        <CustomGrid />
      </ScrollView>
      <JoinGroupModal />
      {/* Removed LeaveGroupModal - leave functionality moved to groupRoom */}
    </SafeAreaView>
  );
}