import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
  Modal,
  Platform,
  Appearance,
  FlatList,
  InteractionManager,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabaseConfig';
import { getFeedPosts } from '../../../(apis)/post';
import PostCard from '../../../components/PostCard';
import MotivationalCarousel from '../../../components/MotivationalCarousel';
import { useAuthStore } from '../../../stores/useAuthStore';
// import CreatePost from '../../../components/CreatePost';
import { AppText } from '../../_layout';
import { router } from 'expo-router';
import { safeNavigate, clearNavigationState } from '../../../utiles/safeNavigation';
import SafeViewErrorBoundary from '../../../components/SafeViewErrorBoundary';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from '../../../utiles/EventEmitter';
import networkErrorHandler from '../../../utiles/networkErrorHandler';
import { getUserStreak, subscribeToStreakChanges, resetAllInactiveStreaks } from '../../../(apis)/streaks';
import { Fonts, TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
// import {useStreak} from '../../../hooks/useStreak';
const { width } = Dimensions.get('window');

const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  accent: '#8B5CF6',
  textSecondary: '#A1A1AA',
  textMuted: '#6B7280',
  cardBg: '#111111',
  border: '#27272A',
  surface: '#1A1A1A',
  primary: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const POSTS_CACHE_KEY = '@posts_cache';
const POSTS_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export default function EnhancedHome() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hotPost, setHotPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullButton, setShowFullButton] = useState(true);
  // const [currentStreak, setCurrentStreak] = useState(0);
  const [user, setUser] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const shareButtonScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const isMounted = useRef(true);
  const lastFetchTime = useRef(0);
  const searchBarHeight = useSharedValue(0);
  const searchBarOpacity = useSharedValue(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(false);
  const { safeNavigate } = useSafeNavigation({
    onCleanup: () => {
      if (isModalVisible) {
        setIsModalVisible(false);
      }
    }
  });

  useEffect(() => {
    isMounted.current = true;
  
    InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        fetchPosts();
      }
    });
  
    const channel = supabase
      .channel('realtime-posts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Realtime insert event:', payload);
          fetchPosts(true);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
  
    const deleteListener = EventEmitter.on('post-deleted', (deletedPostId) => {
      if (isMounted.current) {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== deletedPostId));
      }
    });
  
    // Fetch and subscribe to user's streak - IMPROVED VERSION
    let streakUnsubscribe;
    if (user?.id) {
      (async () => {
        try {
          setStreakLoading(true);

          const streakData = await getUserStreak(user.id);
          if (isMounted.current) {
            setCurrentStreak(streakData?.current_streak || 0);
            setStreakLoading(false);
          }
          
          // Subscribe to real-time updates
          streakUnsubscribe = subscribeToStreakChanges(user.id, (payload) => {
            if (isMounted.current && payload.new) {
              setCurrentStreak(payload.new.current_streak || 0);
            }
          });
        } catch (error) {
          console.error('Error fetching streak:', error);
          if (isMounted.current) {
            setCurrentStreak(0);
            setStreakLoading(false);
          }
        }
      })();
    } else {
      // No user, set to 0 immediately
      setCurrentStreak(0);
      setStreakLoading(false);
    }
  
    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
      deleteListener();
      if (streakUnsubscribe) {
        supabase.removeChannel(streakUnsubscribe);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    const channel = supabase
      .channel('test-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Realtime insert event:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  // Remove theme-based color switching and use consistent dark colors
  const colors = {
    background: COLORS.background,
    text: COLORS.text,
    cardBg: COLORS.cardBg,
    accent: COLORS.accent,
    secondaryText: COLORS.textSecondary,
    border: COLORS.border,
  };

  const fetchHotPosts = async () => {
    try {
      // Use Supabase to get posts count
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (countError || count < 1) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: hotPosts, error } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error || !hotPosts?.length) return null;

      const postsWithEngagement = hotPosts.map(post => ({
        ...post,
        engagementScore: (post.like_count || 0) + (post.comment_count || 0),
      }));

      postsWithEngagement.sort((a, b) => b.engagementScore - a.engagementScore || new Date(b.created_at) - new Date(a.created_at));
      return postsWithEngagement.length > 0 ? postsWithEngagement[0] : null;
    } catch (error) {
      console.error('Error fetching hot post:', error);
      networkErrorHandler.showErrorToUser(error);
      return null;
    }
  };

  const loadCachedPosts = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(POSTS_CACHE_KEY);
      if (cachedData) {
        const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        
        if (now - timestamp < POSTS_CACHE_EXPIRY) {
          console.log('Loading posts from cache');
          if (isMounted.current) {
            setPosts(cachedPosts);
            setFilteredPosts(cachedPosts);
            setLoading(false);
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached posts:', error);
      return false;
    }
  };

  const cachePosts = async (postsToCache) => {
    try {
      const cacheData = {
        posts: postsToCache,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching posts:', error);
    }
  };

  const fetchPosts = async (shouldRefresh = false) => {
    try {
      const now = Date.now();
      if (!shouldRefresh && now - lastFetchTime.current < POSTS_CACHE_EXPIRY) {
        console.log('Using existing posts, cache still valid');
        return;
      }

      if (!shouldRefresh) {
        const hasCachedPosts = await loadCachedPosts();
        if (hasCachedPosts) {
          return;
        }
      }

      console.log('Fetching fresh posts from server');
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            full_name,
            username,
            profile_image,
            profile_initials
          ),
          likes (
            id,
            user_id
          ),
          comments (
            id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        networkErrorHandler.showErrorToUser(error);
        return;
      }

      if (!isMounted.current) return;

      const transformedPosts = postsData?.map(post => ({
        ...post,
        userName: post.users?.full_name || post.user_name || 'Anonymous',
        username: post.users?.username || post.user_username || (post.users?.full_name || post.user_name || 'anonymous').toLowerCase(),
        profile_initials: post.users?.profile_initials || post.user_initials || (post.users?.full_name || post.user_name || 'A').charAt(0).toUpperCase(),
        userAvatar: post.users?.profile_image || post.user_avatar || null,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        isLiked: post.likes?.some(like => like.user_id === user?.uid) || false,
      })) || [];

      setPosts(transformedPosts);
      setFilteredPosts(transformedPosts);
      lastFetchTime.current = now;
      await cachePosts(transformedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      networkErrorHandler.showErrorToUser(error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, [user]);

  const getHotPost = async () => {
    const post = await fetchHotPosts();
    if (isMounted.current) {
      setHotPost(post);
    }
  };

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      getHotPost();
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const queryLower = searchQuery.toLowerCase();
      setFilteredPosts(posts.filter(post =>
        post.content?.toLowerCase().includes(queryLower) ||
        post.userName?.toLowerCase().includes(queryLower) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(queryLower)))
      ));
    }
  }, [searchQuery, posts]);

  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    setShowFullButton(offsetY <= 40);
  }, [scrollY]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(true);
  }, []);

  // Handle modal visibility with proper cleanup
  const handleShowModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handlePostCreated = useCallback(async (postData) => {
    setIsModalVisible(false);
    
    // Refresh posts list
    handleRefresh();
  }, [handleRefresh]);

  const renderHotPostMetadata = (post) => {
    if (!post) return null;
    const formattedTime = post.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
    return (
      <TouchableOpacity onPress={() => router.push(`/postDetailView/${post.id}`)} >
      <View className="flex-row items-center">
        <Image source={{ uri:  user?.profile_initials || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} className="w-8 h-8 rounded-full mr-2" style={{ borderWidth: 1, borderColor: colors.accent }} />
        <View>
          <AppText style={TextStyles.body1}>{post.userName || 'Anonymous'}</AppText>
          <AppText style={TextStyles.caption}>{formattedTime}</AppText>
        </View>
      </View>
      </TouchableOpacity>
      
    );
  };

  const renderCarousel = useCallback(() => (
    <MotivationalCarousel />
  ), []);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    searchBarHeight.value = withSpring(isSearchExpanded ? 0 : 60, {
      damping: 15,
      stiffness: 100
    });
    searchBarOpacity.value = withTiming(isSearchExpanded ? 0 : 1, {
      duration: 200
    });
  };

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    opacity: searchBarOpacity.value,
    transform: [
      {
        translateY: interpolate(
          searchBarHeight.value,
          [0, 60],
          [-20, 0]
        )
      }
    ]
  }));

  const Header = useCallback(() => (
    <View style={{ 
      paddingTop: Platform.OS === 'ios' ? 16 : 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: Platform.OS === 'android' ? 0.5 : 0,
      borderBottomColor: colors.border,
    }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        minHeight: 44,
      }}>
        {/* Left Section - App Name and Streak */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText style={TextStyles.h1}>
          <AppText style={{ fontSize: 26, color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 3, letterSpacing: -1 }}>Social</AppText>
          <AppText style={{ fontSize: 28, color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Bold, letterSpacing: -2, marginRight: 3 }}>z.</AppText>
          </AppText>
           {/* Streak Icon */}
           <TouchableOpacity 
  onPress={() => router.push('/streak')} 
  style={{ 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    opacity: streakLoading ? 0.6 : 1, // Reduced opacity while loading
  }}
>
  <MaterialCommunityIcons name="fire" size={20} color={COLORS.accent} />
  {streakLoading ? (
    <View style={{ marginLeft: 4, width: 20, height: 20, justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={COLORS.accent} />
    </View>
  ) : (
    <Text style={{ 
      color: COLORS.accent, // Fixed: was colors.accent
      marginLeft: 4, 
      fontFamily: Fonts.GeneralSans.Bold,
      fontSize: 16,
    }}>
      {currentStreak}
    </Text>
  )}
</TouchableOpacity>
        </View>

        {/* Right Section - Search and Profile */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity 
            onPress={async () => {
              try {
                await safeNavigate('/(root)/search', { push: true });
              } catch (error) {
                console.error('Search navigation error:', error);
                router.push('/(root)/search');
              }
            }}
            style={{
              flex: 1,
              maxWidth: 140,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              marginHorizontal: 12,
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search" size={16} color={colors.text} />
              <AppText style={TextStyles.body2}>
                Search
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => safeNavigate('/(root)/profile')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: colors.accent,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.cardBg,
            }}
          >
            {user?.profileImage || user?.photoURL ? (
              <Image 
                source={{ uri: user?.profileImage || user?.photoURL }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
                          <Text style={TextStyles.body2}>
              {user?.profile_initials || user?.full_name?.charAt(0) || user?.fullName?.charAt(0) || 'U'}
            </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [colors, safeNavigate, user]);

  const renderHeader = useCallback(() => (
    <View style={{ paddingTop: 8 }}>
      <TouchableOpacity
        onPress={() => router.push('/createpost')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.cardBg,
          paddingHorizontal: 15,
          paddingVertical: 12,
          borderRadius: 25,
          marginHorizontal: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border
        }}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.cardBg,
          borderWidth: 2,
          borderColor: colors.accent,
          overflow: 'hidden',
        }}>
          {user?.profileImage || user?.photoURL ? (
            <Image
              source={{ uri: user?.profileImage || user?.photoURL }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text style={TextStyles.body2}>
              {user?.profile_initials || user?.full_name?.charAt(0) || user?.fullName?.charAt(0) || 'U'}
            </Text>
          )}
        </View>
        <Text style={TextStyles.body2}>What's on your mind? post it</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="images-outline" size={24} color={colors.accent} />
      </TouchableOpacity>
      {renderCarousel()}
    </View>
  ), [renderCarousel, user, colors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  }, []);

  const getItemLayout = useCallback((data, index) => {
    const ITEM_HEIGHT = 200; // Approximate height of a post card
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  const memoizedPosts = useMemo(() => filteredPosts, [filteredPosts]);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (supaUser?.id) {
        const { data, error } = await supabase.from('users').select('*').eq('id', supaUser.id).single();
        if (!error && data) setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Socialz.</Text></View>;

  return (
    <SafeViewErrorBoundary>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent={false} />
        
        {/* Sticky Header */}
        <Header />

        {isSearchExpanded && (
          <Animated.View style={[searchBarAnimatedStyle, { paddingHorizontal: 15, marginBottom: 10 }]}>
            <TextInput
              style={{
                backgroundColor: colors.cardBg,
                color: colors.text,
                borderRadius: 10,
                padding: 10,
                fontSize: 16,
              }}
              placeholder="Search posts..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Animated.View>
        )}
        
        {loading && posts.length === 0 ? (
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: scaleSize(32), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 2, letterSpacing: -1 }}>Socialz.</Text>
              <Text style={{ color: '#A1A1AA', fontSize: scaleSize(18), marginTop: 8, fontFamily: Fonts.GeneralSans.Medium }}>Loading..</Text>
            </View>
          </View>
        ) : (
        <FlatList
            data={memoizedPosts}
            renderItem={({ item }) => <PostCard post={item} />}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={48} color={colors.accent} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.text, fontSize: 18, fontFamily: Fonts.GeneralSans.Bold, textAlign: 'center', marginBottom: 8 }}>
                  No posts yet! Add your First post
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: Fonts.GeneralSans.Medium, textAlign: 'center', maxWidth: 260 }}>
                  Be the first to post and inspire the community. Share your thoughts or something cool!
                </Text>
              </View>
            }
            ListFooterComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 32 }}>
                {/* <MaterialCommunityIcons name="book-open-variant" size={36} color={colors.accent} style={{ marginBottom: 8 }} /> */}
                <Text style={{ color: "white", fontSize: 15, fontFamily: Fonts.GeneralSans.Bold, textAlign: 'center' }}>
                 " Nothing more here—maybe add your posts"
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
            onScroll={handleScroll}
            refreshControl={
              <RefreshControl
          refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.text}
              />
            }
          // Performance optimizations
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={11}
          getItemLayout={getItemLayout}
          />
        )}
        
        {/* <Modal
          animationType="slide"
          transparent={false}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <CreatePostScreen
            onClose={() => setIsModalVisible(false)}
            onPostCreated={(newPost) => {
              setPosts(prevPosts => [newPost, ...prevPosts]);
              setFilteredPosts(prevPosts => [newPost, ...prevPosts]);
            }}
          />
        </Modal> */}
        {/* Floating Create Post Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/createpost')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </SafeViewErrorBoundary>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
});