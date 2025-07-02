import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabaseConfig';
import PostCard from '../../components/PostCard';
import { safeGoBack, clearNavigationState } from '../../utiles/safeNavigation';
import SafeViewErrorBoundary from '../../components/SafeViewErrorBoundary';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { Fonts, TextStyles } from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#000000',
  cardBg: '#111111',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  inputBg: '#1A1A1A',
  accent: '#8B5CF6',
  border: 'rgba(255, 255, 255, 0.1)',
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const searchInputRef = useRef(null);
  const isMounted = useRef(true);
  const router = useRouter();

  // Universal safe navigation
  const { safeNavigate, safeBack } = useSafeNavigation({
    modals: [
      () => isModalVisible && setIsModalVisible(false),
    ],
    onCleanup: () => {
      setIsUnmounting(true);
      setSearchQuery('');
      setSearchResults([]);
      setLoading(false);
    }
  });

  // Sample recent searches and trending topics

  useEffect(() => {
    // Focus search input when page loads
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (isMounted.current) {
        setSearchResults([]);
        setLoading(false);
      }
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query.trim() || !isMounted.current) return;

    if (isMounted.current) setLoading(true);
    try {
      console.log('🔍 Searching for:', query);
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            full_name,
            username,
            profile_image
          )
        `)
        .or(`content.ilike.%${query}%,user_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Search error:', error);
        if (isMounted.current) setSearchResults([]);
      } else {
        console.log('✅ Search results:', posts?.length || 0);
        
        const transformedPosts = posts?.map(post => ({
          ...post,
          userName: post.users?.full_name || post.user_name || 'Anonymous',
          userAvatar: post.users?.profile_image || post.user_avatar || null,
          createdAt: new Date(post.created_at),
          mediaUrls: post.images || [],
        })) || [];
        
        if (isMounted.current) {
          setSearchResults(transformedPosts);
          
          // Add to recent searches if not already there
          if (!recentSearches.includes(query)) {
            setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      if (isMounted.current) setSearchResults([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleRecentSearchPress = (search) => {
    setSearchQuery(search);
    searchInputRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleBack = async () => {
    await safeBack();
  };

  const renderHeader = () => (
    <View style={{
      paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
      backgroundColor: COLORS.background,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <TouchableOpacity
          onPress={handleBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.inputBg,
          borderRadius: 20,
          paddingHorizontal: 16,
          height: 44,
        }}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search posts, users, topics..."
            placeholderTextColor={COLORS.textMuted}
            style={{
              flex: 1,
              color: COLORS.text,
              fontSize: 16,
              marginLeft: 12,
              paddingVertical: 0,
            }}
            autoFocus={false}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.textMuted,
              }}
            >
              <Ionicons name="close" size={14} color={COLORS.background} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 100,
        }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={{
            color: COLORS.textSecondary,
            fontSize: 16,
            marginTop: 16,
            fontFamily: Fonts.GeneralSans.Medium,
          }}>
            Searching...
          </Text>
        </View>
      );
    }

    if (searchQuery.trim() && searchResults.length === 0) {
      return (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 100,
          paddingHorizontal: 40,
        }}>
          <Ionicons name="search-outline" size={64} color={COLORS.textMuted} />
          <Text style={{
            color: COLORS.text,
            fontSize: 18,
            fontFamily: Fonts.GeneralSans.Semibold,
            marginTop: 16,
            textAlign: 'center',
          }}>
            No results found
          </Text>
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 14,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            Try searching for different keywords or check your spelling
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, paddingTop: 20 }}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
            <Text style={{
              color: COLORS.text,
              fontSize: 18,
              fontFamily: Fonts.GeneralSans.Bold,
              marginBottom: 12,
            }}>
              Recent Searches
            </Text>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleRecentSearchPress(search)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
                <Text style={{
                  color: COLORS.textSecondary,
                  fontSize: 16,
                  marginLeft: 12,
                  flex: 1,
                }}>
                  {search}
                </Text>
                <Ionicons name="trending-up" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inspirational Quotes */}
        
      </View>
    );
  };

  const renderSearchResults = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {searchResults.length > 0 ? (
        searchResults.map(item => (
          <PostCard key={item.id} post={item} enableRealTime={false} />
        ))
      ) : (
        renderEmptyState()
      )}
    </ScrollView>
  );

  return (
    <SafeViewErrorBoundary>
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        {renderHeader()}
        
        {/* If unmounting, render empty FlatList to allow safe cleanup */}
        {isUnmounting ? (
          <FlatList data={[]} renderItem={null} />
        ) : (
          searchQuery.trim() ? renderSearchResults() : renderEmptyState()
        )}
      </SafeAreaView>
    </SafeViewErrorBoundary>
  );
};

export default SearchPage; 