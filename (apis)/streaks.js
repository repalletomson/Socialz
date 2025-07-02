import { supabase } from '../config/supabaseConfig';

/**
 * Simple and robust streak system
 * - 1 post per day OR 5 comments per day = streak increment
 * - Only once per day
 * - Simple date-based logic
 */

/**
 * Get user's current streak data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The streak data
 */
export const getUserStreak = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    // Create initial record if doesn't exist
    if (!data) {
      const initialStreak = {
        user_id: userId,
        current_streak: 0,
        highest_streak: 0,
        last_streak_date: null,
        daily_posts_count: 0,
        daily_comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newStreak, error: insertError } = await supabase
        .from('streaks')
        .insert(initialStreak)
        .select()
        .single();

      if (insertError) throw insertError;
      return newStreak;
    }

    return data;
  } catch (error) {
    console.error('Error getting user streak:', error);
    throw error;
  }
};

/**
 * Get today's date string (YYYY-MM-DD)
 */
const getTodayString = () => {
  const now = new Date();
  return now.getFullYear() + '-' + 
         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
         String(now.getDate()).padStart(2, '0');
};

/**
 * Update streak when user creates a post
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Result with streak info
 */
export const updateStreakForPost = async (userId) => {
  try {
    const streakData = await getUserStreak(userId);
    const today = getTodayString();

    // If already got streak today, just increment post count
    if (streakData.last_streak_date === today) {
      const { data: updated, error } = await supabase
        .from('streaks')
        .update({
          daily_posts_count: (streakData.daily_posts_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { ...updated, streakIncreased: false, alreadyCompleted: true };
    }

    // New day - increment streak and update counters
    const newStreak = (streakData.current_streak || 0) + 1;
    const newHighest = Math.max(newStreak, streakData.highest_streak || 0);

    const { data: updated, error } = await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        highest_streak: newHighest,
        last_streak_date: today,
        daily_posts_count: 1,
        daily_comments_count: 0, // Reset comments for new day
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`🎉 Streak increased to ${newStreak} for post!`);
    return { 
      ...updated, 
      streakIncreased: true, 
      previousStreak: streakData.current_streak || 0 
    };

  } catch (error) {
    console.error('Error updating streak for post:', error);
    throw error;
  }
};

/**
 * Update streak when user comments (need 5 comments for streak)
 * @param {string} userId - The user ID  
 * @param {string} postOwnerId - The post owner ID
 * @returns {Promise<Object>} Result with streak info
 */
export const updateStreakForComment = async (userId, postOwnerId) => {
  try {
    // Don't count comments on own posts
    if (userId === postOwnerId) {
      return { streakIncreased: false, ownPost: true };
    }

    const streakData = await getUserStreak(userId);
    const today = getTodayString();

    // If already got streak today, just increment comment count
    if (streakData.last_streak_date === today) {
      const { data: updated, error } = await supabase
        .from('streaks')
        .update({
          daily_comments_count: (streakData.daily_comments_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { ...updated, streakIncreased: false, alreadyCompleted: true };
    }

    // Count comments for today
    const newCommentCount = (streakData.daily_comments_count || 0) + 1;

    // Need 5 comments for streak
    if (newCommentCount >= 5) {
      // Increment streak - 5 comments reached!
      const newStreak = (streakData.current_streak || 0) + 1;
      const newHighest = Math.max(newStreak, streakData.highest_streak || 0);

      const { data: updated, error } = await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          highest_streak: newHighest,
          last_streak_date: today,
          daily_comments_count: newCommentCount,
          daily_posts_count: 0, // Reset posts for new day
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`🎉 Streak increased to ${newStreak} for 5 comments!`);
      return { 
        ...updated, 
        streakIncreased: true, 
        previousStreak: streakData.current_streak || 0 
      };
    } else {
      // Just increment comment count
      const { data: updated, error } = await supabase
        .from('streaks')
        .update({
          daily_comments_count: newCommentCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`💬 Comment count: ${newCommentCount}/5`);
      return { ...updated, streakIncreased: false, commentsProgress: newCommentCount };
    }

  } catch (error) {
    console.error('Error updating streak for comment:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time streak changes
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription object
 */
export const subscribeToStreakChanges = (userId, callback) => {
  return supabase
    .channel(`streak_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public', 
      table: 'streaks',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
};

/**
 * Get today's progress
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Today's progress
 */
export const getTodayProgress = async (userId) => {
  try {
    const streakData = await getUserStreak(userId);
    const today = getTodayString();
    
    const isToday = streakData.last_streak_date === today;
    
    return {
      currentStreak: streakData.current_streak || 0,
      highestStreak: streakData.highest_streak || 0,
      commentsToday: isToday ? (streakData.daily_comments_count || 0) : 0,
      postsToday: isToday ? (streakData.daily_posts_count || 0) : 0,
      streakCompletedToday: isToday,
      commentsNeeded: Math.max(0, 5 - (isToday ? (streakData.daily_comments_count || 0) : 0)),
    };
  } catch (error) {
    console.error('Error getting today progress:', error);
    return {
      currentStreak: 0,
      highestStreak: 0,
      commentsToday: 0,
      postsToday: 0,
      streakCompletedToday: false,
      commentsNeeded: 5,
    };
  }
};

export default {
  getUserStreak,
  updateStreakForPost,
  updateStreakForComment,
  subscribeToStreakChanges,
  getTodayProgress
}; 