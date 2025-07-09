import { supabase } from '../config/supabaseConfig';

/**
 * Get the current streak data for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The streak data
 */

// (NOBRIDGE) LOG  🖼️ No images found in post
export const getUserStreak = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Create initial streak record if it doesn't exist
      const initialStreak = {
        user_id: userId,
        current_streak: 0,
        highest_streak: 0,
        last_activity_date: null,
        activity_counts: {
          posts: 0,
          comments: 0,
          likes: 0
        },
        streak_active: false,
      };

      const { data: newStreak, error: insertError } = await supabase
        .from('streaks')
        .insert(initialStreak)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return newStreak;
    }

    // Check if streak needs to be reset due to inactivity
    if (data.last_activity_date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActivityDate = new Date(data.last_activity_date);
      const lastActivityDay = new Date(
        lastActivityDate.getFullYear(), 
        lastActivityDate.getMonth(), 
        lastActivityDate.getDate()
      );

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // If the last activity was before yesterday, reset streak
      if (lastActivityDay.getTime() < yesterday.getTime()) {
        const resetData = {
          current_streak: 0,
          last_activity_date: null,
          streak_active: false,
          updated_at: new Date().toISOString(),
        };

        const { data: updatedStreak, error: updateError } = await supabase
          .from('streaks')
          .update(resetData)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return { ...updatedStreak, streakReset: true };
      }

      // Check if they have activity today to mark streak as active
      const streakActive = lastActivityDay.getTime() === today.getTime();
      return { ...data, streak_active: streakActive };
    }

    return data;
  } catch (error) {
    console.error('Error getting user streak:', error);
    throw error;
  }
};

/**
 * Check if user has activity today
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether user has activity today
 */
export const hasActivityToday = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('last_activity_date')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data?.last_activity_date) {
      return false;
    }

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastActivityDate = new Date(data.last_activity_date);
    const lastActivityDay = new Date(
      lastActivityDate.getFullYear(),
      lastActivityDate.getMonth(),
      lastActivityDate.getDate()
    );

    return lastActivityDay.getTime() === todayDate.getTime();
  } catch (error) {
    console.error('Error checking activity today:', error);
    return false;
  }
};

/**
 * Update user streak and activity counts based on activity type
 * @param {string} userId - The user ID
 * @param {string} activityType - Type of activity ('posts', 'comments', 'likes')
 * @returns {Promise<Object>} Updated streak information
 */
export const updateUserActivityStreak = async (userId, activityType) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!['posts', 'comments', 'likes'].includes(activityType)) {
      throw new Error('Invalid activity type');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if user already had an activity today
    const hadActivityToday = await hasActivityToday(userId);

    // Get current streak data
    let streakData = await getUserStreak(userId);

    // Always update the activity count
    const updatedActivityCounts = {
      ...streakData.activity_counts || {
        posts: 0,
        comments: 0,
        likes: 0
      }
    };
    updatedActivityCounts[activityType] = (updatedActivityCounts[activityType] || 0) + 1;

    let streakIncreased = false;
    let streakStarted = false;
    let newCurrentStreak = streakData.current_streak || 0;
    let newHighestStreak = streakData.highest_streak || 0;

    // If user didn't have activity today, increment streak
    if (!hadActivityToday) {
      newCurrentStreak = (streakData.current_streak || 0) + 1;
      streakIncreased = true;
      
      if (newCurrentStreak === 1) {
        streakStarted = true;
      }

      // Update highest streak if current is higher
      if (newCurrentStreak > newHighestStreak) {
        newHighestStreak = newCurrentStreak;
      }
    }

    const updateData = {
      current_streak: newCurrentStreak,
      highest_streak: newHighestStreak,
      last_activity_date: today.toISOString().split('T')[0], // Store as date only
      activity_counts: updatedActivityCounts,
      streak_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedStreak, error } = await supabase
      .from('streaks')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { 
      ...updatedStreak, 
      streakIncreased, 
      streakStarted,
      activityType,
      previousStreak: streakData.current_streak || 0
    };
  } catch (error) {
    console.error('Error updating user activity streak:', error);
    throw error;
  }
};

/**
 * Get streak leaderboard for a college or globally
 * @param {string} collegeName - Optional college name to filter by
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} Array of top streak users
 */
export const getStreakLeaderboard = async (collegeName = null, limit = 10) => {
  try {
    let query = supabase
      .from('streaks')
      .select(`
        *,
        users!inner (
          id,
          full_name,
          username,
          profile_image,
          college
        )
      `)
      .order('current_streak', { ascending: false })
      .limit(limit);

    // If college is specified, filter by college
    // if (collegeName) {
    //   query = query.eq('users.college->name', collegeName);
    // }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data?.map(item => ({
      ...item,
      user: item.users
    })) || [];
  } catch (error) {
    console.error('Error getting streak leaderboard:', error);
    return [];
  }
};

/**
 * Get user's streak rank globally or within college
 * @param {string} userId - The user ID
 * @param {string} collegeName - Optional college name to filter by
 * @returns {Promise<Object>} User's rank information
 */
export const getUserStreakRank = async (userId, collegeName = null) => {
  try {
    const userStreak = await getUserStreak(userId);
    
    let query = supabase
      .from('streaks')
      .select('current_streak', { count: 'exact' })
      .gt('current_streak', userStreak.current_streak || 0);

    // if (collegeName) {
    //   query = query.eq('users.college->name', collegeName);
    // }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      rank: (count || 0) + 1,
      currentStreak: userStreak.current_streak || 0,
      streakActive: userStreak.streak_active || false
    };
  } catch (error) {
    console.error('Error getting user streak rank:', error);
    return {
      rank: null,
      currentStreak: 0,
      streakActive: false
    };
  }
};

/**
 * Reset user's streak (admin function or if user wants to restart)
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Updated streak data
 */
export const resetUserStreak = async (userId) => {
  try {
    const resetData = {
      current_streak: 0,
      last_activity_date: null,
      streak_active: false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('streaks')
      .update(resetData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error resetting user streak:', error);
    throw error;
  }
};

/**
 * Get streak statistics for analytics
 * @param {string} collegeName - Optional college name to filter by
 * @returns {Promise<Object>} Streak statistics
 */
export const getStreakStatistics = async (collegeName = null) => {
  try {
    let query = supabase
      .from('streaks')
      .select('current_streak, highest_streak, streak_active');

    // if (collegeName) {
    //   query = query.eq('users.college->name', collegeName);
    // }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const stats = {
      totalUsers: data?.length || 0,
      activeStreaks: data?.filter(s => s.streak_active).length || 0,
      averageCurrentStreak: 0,
      averageHighestStreak: 0,
      longestCurrentStreak: 0,
      longestAllTimeStreak: 0,
    };

    if (data && data.length > 0) {
      stats.averageCurrentStreak = data.reduce((sum, s) => sum + (s.current_streak || 0), 0) / data.length;
      stats.averageHighestStreak = data.reduce((sum, s) => sum + (s.highest_streak || 0), 0) / data.length;
      stats.longestCurrentStreak = Math.max(...data.map(s => s.current_streak || 0));
      stats.longestAllTimeStreak = Math.max(...data.map(s => s.highest_streak || 0));
    }

    return stats;
  } catch (error) {
    console.error('Error getting streak statistics:', error);
    return {
      totalUsers: 0,
      activeStreaks: 0,
      averageCurrentStreak: 0,
      averageHighestStreak: 0,
      longestCurrentStreak: 0,
      longestAllTimeStreak: 0,
    };
  }
};

/**
 * Increment user streak (simplified version)
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Updated streak information
 */
export const incrementUserStreak = async (userId) => {
  return await updateUserActivityStreak(userId, 'posts');
};

/**
 * Subscribe to streak changes for real-time updates
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function for updates
 * @returns {Object} Subscription objectre
 */
export const subscribeToStreakChanges = (userId, callback) => {
  return supabase
    .channel(`streak_changes_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'streaks',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
};

export default {
  getUserStreak,
  hasActivityToday,
  updateUserActivityStreak,
  getStreakLeaderboard,
  getUserStreakRank,
  resetUserStreak,
  getStreakStatistics,
  incrementUserStreak,
  subscribeToStreakChanges
}; 