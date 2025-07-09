import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabaseConfig';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { getSavedPosts } from '../../(apis)/post';
import ProfilePostCard from '../../components/ProfilePostCard';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { scaleSize, verticalScale } from '../../utiles/common';
import { useFocusEffect } from '@react-navigation/native';

// Consistent Color Palette - Black Theme with Purple Accents
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

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const isMounted = useRef(true);
  
  const { loginOut, user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('About');
  const tabs = ['About', 'Posts', 'Saved Posts'];

  // Universal safe navigation
  const { safeNavigate, safeBack } = useSafeNavigation({
    modals: [
      () => isModalVisible && setIsModalVisible(false),
    ],
    onCleanup: () => {
      // Clean up any state here
      setUserData(null);
      setLoading(false);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Move useCallback to top level - before any conditional returns
  const goHome = useCallback(async () => {
    await safeNavigate('/(root)/(tabs)/home', { replace: true });
  }, [safeNavigate]);

  // Load user data from Supabase
  const loadUserData = async () => {
    try {
      if (!user?.id || !isMounted.current) {
        console.log('No user found in context');
        if (isMounted.current) setLoading(false);
        return;
      }

      console.log('Loading user data for:', user.id);
      
      // Get user data from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        // Use context user data if database fetch fails
        if (isMounted.current) setUserData(user);
      } else {
        console.log('User data loaded successfully:', data);
        if (isMounted.current) setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to context user data
      if (isMounted.current) setUserData(user);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // Handle logout with confirmation
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
              await loginOut();
              // Don't manually navigate - let the auth context handle it
              // The auth context will automatically redirect when isAuthenticated becomes false
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Load data when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      if (isMounted.current) setLoading(false);
    }
  }, [user, isAuthenticated]);

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

  // Show loading state
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.background 
      }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={{ fontSize: scaleSize(32), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 2, letterSpacing: -1 }}>social</Text>
              <Text style={{ fontSize: scaleSize(44), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Bold, letterSpacing: -2 }}>z.</Text>
            </View>
            <Text style={{ color: '#A1A1AA', fontSize: scaleSize(18), marginTop: 8, fontFamily: Fonts.GeneralSans.Medium }}>Loading...</Text>
          </View>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </View>
    );
  }

  // Show authentication required if not logged in
  if (!isAuthenticated || !user) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.background,
        padding: 20
      }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Ionicons name="person-circle-outline" size={64} color={COLORS.textMuted} />
        <Text style={{
          color: COLORS.text,
          fontSize: 18,
          fontFamily: Fonts.GeneralSans.Semibold,
          marginTop: 16,
          marginBottom: 8,
        }}>
          Not Logged In
        </Text>
        <Text style={{
          color: COLORS.textMuted,
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          Please sign in to view your profile
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signin')}
          style={{
            backgroundColor: COLORS.accent,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
          }}
        >
          <Text style={TextStyles.button}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 45 : 25,
        paddingHorizontal: 20,
        paddingBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 26, color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 2, letterSpacing: -1 }}>social</Text>
          <Text style={{ fontSize: 30, color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Bold, letterSpacing: -2 }}>z.</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(root)/settings')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.cardBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Info - Twitter-like Layout */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          {/* Profile Header with Avatar and Edit Button */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}>
            {/* Left Side - Profile Avatar and Info */}
            <View style={{ flex: 1 }}>
              {/* Profile Image */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.cardBg,
                marginBottom: 12,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: COLORS.accent,
              }}>
                {userData?.profile_image || userData?.profileImage ? (
                  <Image
                    source={{ 
                      uri: userData?.profile_image || userData?.profileImage
                    }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{
                    color: COLORS.text,
                    fontSize: 28,
                    fontWeight: '800',
                    letterSpacing: -0.5,
                  }}>
                    {userData?.profile_initials || userData?.full_name?.charAt(0) || 'U'}
                  </Text>
                )}
              </View>

              {/* Name and Username */}
              <Text style={{
                fontSize: 22,
                fontFamily: Fonts.GeneralSans.Bold,
                color: COLORS.text,
                marginBottom: 2,
                letterSpacing: -0.3,
              }}>
                {userData?.full_name || userData?.fullName || 'User'}
              </Text>
              <Text style={{
                fontSize: 15,
                color: COLORS.textMuted,
                marginBottom: 8,
                fontFamily: Fonts.GeneralSans.Regular,
              }}>
                @{userData?.username || 'username'}
              </Text>

              {/* Bio */}
              {userData?.bio && (
                <Text style={{
                  color: COLORS.textSecondary,
                  fontSize: 15,
                  lineHeight: 20,
                  marginBottom: 12,
                  fontFamily: Fonts.GeneralSans.Regular,
                }}>
                  {userData.bio}
                </Text>
              )}

              {/* College and Education Info */}
              {/* <View style={{ flexDirection: 'column', gap: 6 }}>
                {(userData?.college || userData?.branch) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="school" size={16} color={COLORS.textMuted} />
                    <Text style={{
                      color: COLORS.textMuted,
                      fontSize: 14,
                      marginLeft: 6,
                      fontWeight: '400',
                    }}>
                      {userData?.college && userData?.branch 
                        ? `${userData.branch} at ${userData.college}`
                        : userData?.college || userData?.branch}
                    </Text>
                  </View>
                )}
                
                {userData?.passout_year && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="event" size={16} color={COLORS.textMuted} />
                    <Text style={{
                      color: COLORS.textMuted,
                      fontSize: 14,
                      marginLeft: 6,
                      fontWeight: '400',
                    }}>
                      Class of {userData.passout_year}
                    </Text>
                  </View>
                )}
              </View> */}
            </View>

            {/* Right Side - Edit Profile Button */}
            <TouchableOpacity
              onPress={() => router.push('/(root)/editprofile')}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: COLORS.textMuted,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginTop: 8,
              }}
            >
              <Text style={{
                color: COLORS.text,
                fontSize: 14,
                fontFamily: Fonts.GeneralSans.Semibold,
                letterSpacing: -0.2,
              }}>
                Edit profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab ? COLORS.accent : 'transparent',
              }}
            >
              <Text style={{
                color: activeTab === tab ? COLORS.accent : COLORS.textMuted,
                fontSize: 15,
                fontFamily: Fonts.GeneralSans.Semibold,
                textAlign: 'center',
              }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View >
          {activeTab === 'About' && (
            <View style={{ gap: 16 }}>
              {/* Education Details Card */}
              {(userData?.college || userData?.branch || userData?.passout_year) && (
                <View style={{
                  backgroundColor: COLORS.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}>
                    <Text style={{
                      color: COLORS.text,
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 8,
                    }}>
                      Education
                    </Text>
                  </View>
                  
                  {userData?.college && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: userData?.branch || userData?.passout_year ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}>
                      <Ionicons name="school-outline" size={20} color={COLORS.accent} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' }}>
                          {userData.college}
                        </Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
                          College/University
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {userData?.branch && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: userData?.passout_year ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}>
                      <Ionicons name="book-outline" size={20} color={COLORS.accent} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' }}>
                          {userData.branch}
                        </Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
                          Branch/Course
                        </Text>
                      </View>
                    </View>
                  )}

                  {userData?.passout_year && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                    }}>
                      <Ionicons name="calendar-outline" size={20} color={COLORS.accent} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' }}>
                          Class of {userData.passout_year}
                        </Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
                          Expected Graduation
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Interests Card */}
              {userData?.interests && (
                <View style={{
                  backgroundColor: COLORS.cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}>
                    <Text style={{
                      color: COLORS.text,
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 8,
                    }}>
                      Interests
                    </Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                  }}>
                    <Ionicons name="heart-outline" size={20} color={COLORS.accent} />
                    <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginLeft: 12, flex: 1, lineHeight: 22 }}>
                      {Array.isArray(userData.interests) ? 
                        userData.interests.map(interest => 
                          interest.charAt(0).toUpperCase() + interest.slice(1)
                        ).join(', ') : 
                        userData.interests
                      }
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Posts' && (
            <UserPostsList userId={userData?.id || userData?.id} />
          )}

          {activeTab === 'Saved Posts' && (
            <SavedPostsList userId={userData?.id || userData?.id} />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const UserPostsList = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadPosts();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);
    
    const loadPosts = async () => {
    if (!userId || !isMounted.current) return;
    
    setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

      if (error) throw error;
        if (isMounted.current) {
        setPosts(data);
        }
      } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

  if (loading) {
    return (
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {posts.length > 0 ? (
        posts.map(post => (
          <ProfilePostCard key={post.id} post={post} />
        ))
      ) : (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="documents-outline" size={48} color={COLORS.textMuted} />
          <Text style={TextStyles.body}>
            No Posts Yet
          </Text>
          <Text style={{
            color: COLORS.textMuted,
            marginTop: 8,
            fontSize: 14,
            textAlign: 'center',
            paddingHorizontal: 40,
          }}>
            This user hasn't shared any posts.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const SavedPostsList = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadSavedPosts();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);
    
    const loadSavedPosts = async () => {
    if (!userId || !isMounted.current) return;
    
    setLoading(true);
      try {
        const savedPosts = await getSavedPosts(userId);
        if (isMounted.current) {
        setPosts(savedPosts);
        }
      } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

  if (loading) {
    return (
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Loading saved posts...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {posts.length > 0 ? (
        posts.map(post => (
          <ProfilePostCard key={post.id} post={post} />
        ))
      ) : (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="documents-outline" size={48} color={COLORS.textMuted} />
          <Text style={{ 
            color: COLORS.textMuted, 
            marginTop: 16, 
            fontSize: 16,
            fontWeight: '500'
          }}>
            No Saved Posts Yet
          </Text>
         
        </View>
      )}
    </ScrollView>
  );
};

export default Profile;
