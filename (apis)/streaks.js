// // import { supabase } from '../config/supabaseConfig';
// // import {
// //   hasActivityToday,
// //   updateUserActivityStreak,
// //   getUserStreakRank,
// //   resetUserStreak,
// //   getStreakStatistics,
// //   incrementUserStreak
// // } from './supabaseStreaks';

// // /**
// //  * Simple and robust streak system
// //  * - 1 post per day OR 5 comments per day = streak increment
// //  * - Only once per day
// //  * - Simple date-based logic
// //  */

// // /**
// //  * Get user's current streak data
// //  * @param {string} userId - The user ID
// //  * @returns {Promise<Object>} The streak data
// //  */
// // export const getStreakLeaderboard = async (collegeName = null, limit = 10) => {
// //   try {
// //     let query = supabase
// //       .from('streaks')
// //       .select(`
// //         *,
// //         users!inner (
// //           id,
// //           full_name,
// //           username,
// //           profile_image,
// //           college
// //         )
// //       `)
// //       .order('current_streak', { ascending: false })
// //       .limit(limit);

// //     // If college is specified, filter by college
// //     // if (collegeName) {
// //     //   query = query.eq('users.college->name', collegeName);
// //     // }

// //     const { data, error } = await query;

// //     if (error) {
// //       throw error;
// //     }

// //     return data?.map(item => ({
// //       ...item,
// //       user: item.users
// //     })) || [];
// //   } catch (error) {
// //     console.error('Error getting streak leaderboard:', error);
// //     return [];
// //   }
// // };

// // export const getUserStreak = async (userId) => {
// //   try {
// //     if (!userId) throw new Error('User ID is required');
// //     const { data, error } = await supabase
// //       .from('streaks')
// //       .select('*')
// //       .eq('user_id', userId)
// //       .maybeSingle();
// //     if (error) throw error;
// //     if (!data) {
// //       const initialStreak = {
// //         user_id: userId,
// //         current_streak: 0,
// //         highest_streak: 0,
// //         last_activity_date: null,
// //         daily_posts_count: 0,
// //         daily_comments_count: 0,
// //         streak_completed_today: false,
// //         created_at: new Date().toISOString(),
// //         updated_at: new Date().toISOString(),
// //       };
// //       const { data: newStreak, error: insertError } = await supabase
// //         .from('streaks')
// //         .insert(initialStreak)
// //         .select()
// //         .single();
// //       if (insertError) throw insertError;
// //       return newStreak;
// //     }
// //     // --- AUTO-RESET LOGIC ---
// //     if (data.last_activity_date) {
// //       const now = new Date();
// //       const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// //       const lastActivityDate = new Date(data.last_activity_date);
// //       const lastActivityDay = new Date(
// //         lastActivityDate.getFullYear(),
// //         lastActivityDate.getMonth(),
// //         lastActivityDate.getDate()
// //       );
// //       const yesterday = new Date(today);
// //       yesterday.setDate(yesterday.getDate() - 1);
// //       // If the last activity was before yesterday, reset streak
// //       if (lastActivityDay.getTime() < yesterday.getTime()) {
// //         const resetData = {
// //           current_streak: 0,
// //           last_activity_date: null,
// //           daily_posts_count: 0,
// //           daily_comments_count: 0,
// //           streak_completed_today: false,
// //           updated_at: new Date().toISOString(),
// //         };
// //         const { data: updatedStreak, error: updateError } = await supabase
// //           .from('streaks')
// //           .update(resetData)
// //           .eq('user_id', userId)
// //           .select()
// //           .single();
// //         if (updateError) throw updateError;
// //         return { ...updatedStreak, streakReset: true };
// //       }
// //     }
// //     return data;
// //   } catch (error) {
// //     console.error('Error getting user streak:', error);
// //     throw error;
// //   }
// // };

// // /**
// //  * Get today's date string (YYYY-MM-DD)
// //  */
// // const getTodayString = () => {
// //   const now = new Date();
// //   return now.getFullYear() + '-' + 
// //          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
// //          String(now.getDate()).padStart(2, '0');
// // };

// // /**
// //  * Update streak when user creates a post
// //  * @param {string} userId - The user ID
// //  * @returns {Promise<Object>} Result with streak info
// //  */
// // export const updateStreakForPost = async (userId) => {
// //   try {
// //     const streakData = await getUserStreak(userId);
// //     const today = new Date().toISOString().split('T')[0];
// //     if (streakData.last_activity_date === today) {
// //       // Already posted today, just increment daily_posts_count
// //       const { data: updated, error } = await supabase
// //         .from('streaks')
// //         .update({
// //           daily_posts_count: (streakData.daily_posts_count || 0) + 1,
// //           updated_at: new Date().toISOString(),
// //         })
// //         .eq('user_id', userId)
// //         .select()
// //         .single();
// //       if (error) throw error;
// //       return { ...updated, streakIncreased: false, alreadyCompleted: true };
// //     }
// //     // New day: increment streak, set streak_completed_today TRUE, update highest_streak if needed
// //     const newCurrentStreak = (streakData.current_streak || 0) + 1;
// //     const newHighestStreak = Math.max(newCurrentStreak, streakData.highest_streak || 0);
// //     const { data: updated, error } = await supabase
// //       .from('streaks')
// //       .update({
// //         current_streak: newCurrentStreak,
// //         highest_streak: newHighestStreak,
// //         last_activity_date: today,
// //         daily_posts_count: 1,
// //         daily_comments_count: 0,
// //         streak_completed_today: true,
// //         updated_at: new Date().toISOString(),
// //       })
// //       .eq('user_id', userId)
// //       .select()
// //       .single();
// //     if (error) throw error;
// //     return {
// //       ...updated,
// //       streakIncreased: true,
// //       previousStreak: streakData.current_streak || 0,
// //     };
// //   } catch (error) {
// //     console.error('Error updating streak for post:', error);
// //     throw error;
// //   }
// // };

// // /**
// //  * Update streak when user comments (need 5 comments for streak)
// //  * @param {string} userId - The user ID  
// //  * @param {string} postOwnerId - The post owner ID
// //  * @returns {Promise<Object>} Result with streak info
// //  */
// // export const updateStreakForComment = async (userId, postOwnerId) => {
// //   try {
// //     if (userId === postOwnerId) {
// //       return { streakIncreased: false, ownPost: true };
// //     }
// //     const streakData = await getUserStreak(userId);
// //     const today = new Date().toISOString().split('T')[0];
// //     let newDailyComments = streakData.daily_comments_count || 0;
// //     let streakIncreased = false;
// //     let newCurrentStreak = streakData.current_streak || 0;
// //     let newHighestStreak = streakData.highest_streak || 0;
// //     let streak_completed_today = streakData.streak_completed_today;
// //     if (streakData.last_activity_date === today) {
// //       // Already commented today, just increment daily_comments_count
// //       newDailyComments += 1;
// //       // If already completed streak today, just update count
// //       const { data: updated, error } = await supabase
// //         .from('streaks')
// //         .update({
// //           daily_comments_count: newDailyComments,
// //           updated_at: new Date().toISOString(),
// //         })
// //         .eq('user_id', userId)
// //         .select()
// //         .single();
// //       if (error) throw error;
// //       return { ...updated, streakIncreased: false, commentsProgress: newDailyComments };
// //     }
// //     // New day or streak not completed yet
// //     newDailyComments = 1;
// //     if (newDailyComments >= 5) {
// //       // 5th comment today: increment streak
// //       newCurrentStreak += 1;
// //       newHighestStreak = Math.max(newCurrentStreak, streakData.highest_streak || 0);
// //       streak_completed_today = true;
// //     } else {
// //       streak_completed_today = false;
// //     }
// //     const { data: updated, error } = await supabase
// //       .from('streaks')
// //       .update({
// //         current_streak: newCurrentStreak,
// //         highest_streak: newHighestStreak,
// //         last_activity_date: today,
// //         daily_posts_count: 0,
// //         daily_comments_count: newDailyComments,
// //         streak_completed_today: streak_completed_today,
// //         updated_at: new Date().toISOString(),
// //       })
// //       .eq('user_id', userId)
// //       .select()
// //       .single();
// //     if (error) throw error;
// //     return {
// //       ...updated,
// //       streakIncreased: streak_completed_today,
// //       previousStreak: streakData.current_streak || 0,
// //       commentsProgress: newDailyComments,
// //     };
// //   } catch (error) {
// //     console.error('Error updating streak for comment:', error);
// //     throw error;
// //   }
// // };

// // /**
// //  * Subscribe to real-time streak changes
// //  * @param {string} userId - The user ID
// //  * @param {Function} callback - Callback function
// //  * @returns {Object} Subscription object
// //  */
// // export const subscribeToStreakChanges = (userId, callback) => {
// //   return supabase
// //     .channel(`streak_${userId}`)
// //     .on('postgres_changes', {
// //       event: '*',
// //       schema: 'public', 
// //       table: 'streaks',
// //       filter: `user_id=eq.${userId}`
// //     }, callback)
// //     .subscribe();
// // };

// // /**
// //  * Get today's progress
// //  * @param {string} userId - The user ID
// //  * @returns {Promise<Object>} Today's progress
// //  */
// // export const getTodayProgress = async (userId) => {
// //   try {
// //     const streakData = await getUserStreak(userId);
// //     const today = getTodayString();
    
// //     const isToday = streakData.last_activity_date === today;
    
// //     return {
// //       currentStreak: streakData.current_streak || 0,
// //       highestStreak: streakData.highest_streak || 0,
// //       commentsToday: isToday ? (streakData.daily_comments_count || 0) : 0,
// //       postsToday: isToday ? (streakData.daily_posts_count || 0) : 0,
// //       streakCompletedToday: isToday,
// //       commentsNeeded: Math.max(0, 5 - (isToday ? (streakData.daily_comments_count || 0) : 0)),
// //     };
// //   } catch (error) {
// //     console.error('Error getting today progress:', error);
// //     return {
// //       currentStreak: 0,
// //       highestStreak: 0,
// //       commentsToday: 0,
// //       postsToday: 0,
// //       streakCompletedToday: false,
// //       commentsNeeded: 5,
// //     };
// //   }
// // };

// // export { hasActivityToday, updateUserActivityStreak, getUserStreakRank, resetUserStreak, getStreakStatistics, incrementUserStreak };

// // export default {
// //   getUserStreak,
// //   updateStreakForPost,
// //   updateStreakForComment,
// //   subscribeToStreakChanges,
// //   getTodayProgress,
// //   hasActivityToday,
// //   updateUserActivityStreak,
// //   getUserStreakRank,
// //   resetUserStreak,
// //   getStreakStatistics,
// //   incrementUserStreak,
// // }; 

// import { supabase } from '../config/supabaseConfig';
// import { DateTime } from 'luxon';

// /**
//  * Simple and robust streak system
//  * - 1 post per day OR 5 comments per day = streak increment
//  * - Only once per day
//  * - Simple date-based logic with IST timezone
//  */

// /**
//  * Get today's date string in IST (YYYY-MM-DD)
//  */
// const getTodayStringIST = () => {
//   return DateTime.now().setZone('Asia/Kolkata').toISODate();
// };

// /**
//  * Get user's current streak data
//  * @param {string} userId - The user ID
//  * @returns {Promise<Object>} The streak data
//  */
// export const getUserStreak = async (userId) => {
//   try {
//     if (!userId) throw new Error('User ID is required');
//     const { data, error } = await supabase
//       .from('streaks')
//       .select('*')
//       .eq('user_id', userId)
//       .maybeSingle();
//     if (error) throw error;
//     if (!data) {
//       const initialStreak = {
//         user_id: userId,
//         current_streak: 0,
//         highest_streak: 0,
//         last_activity_date: null,
//         daily_posts_count: 0,
//         daily_comments_count: 0,
//         streak_completed_today: false,
//         created_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//         updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//       };
//       const { data: newStreak, error: insertError } = await supabase
//         .from('streaks')
//         .insert(initialStreak)
//         .select()
//         .single();
//       if (insertError) throw insertError;
//       return newStreak;
//     }
//     // --- AUTO-RESET LOGIC ---
//     const now = DateTime.now().setZone('Asia/Kolkata');
//     const today = now.startOf('day');
//     const lastActivityDate = data.last_activity_date ? DateTime.fromISO(data.last_activity_date, { zone: 'Asia/Kolkata' }).startOf('day') : null;
//     const yesterday = today.minus({ days: 1 });
//     if (lastActivityDate && lastActivityDate < yesterday) {
//       const resetData = {
//         current_streak: 0,
//         last_activity_date: null,
//         daily_posts_count: 0,
//         daily_comments_count: 0,
//         streak_completed_today: false,
//         updated_at: now.toISO(),
//       };
//       const { data: updatedStreak, error: updateError } = await supabase
//         .from('streaks')
//         .update(resetData)
//         .eq('user_id', userId)
//         .select()
//         .single();
//       if (updateError) throw updateError;
//       return { ...updatedStreak, streakReset: true };
//     }
//     return data;
//   } catch (error) {
//     console.error('Error getting user streak:', error);
//     throw error;
//   }
// };

// /**
//  * Get streak leaderboard
//  * @param {string} collegeName - Optional college filter
//  * @param {number} limit - Number of records to return
//  * @returns {Promise<Array>} Leaderboard data
//  */
// export const getStreakLeaderboard = async (collegeName = null, limit = 10) => {
//   try {
//     let query = supabase
//       .from('streaks')
//       .select(`
//         *,
//         users!inner (
//           id,
//           full_name,
//           username,
//           profile_image,
//           college
//         )
//       `)
//       .order('current_streak', { ascending: false })
//       .limit(limit);

//     if (collegeName) {
//       query = query.eq('users.college', collegeName);
//     }

//     const { data, error } = await query;

//     if (error) throw error;

//     return data?.map(item => ({
//       ...item,
//       user: item.users
//     })) || [];
//   } catch (error) {
//     console.error('Error getting streak leaderboard:', error);
//     return [];
//   }
// };

// /**
//  * Update streak when user creates a post
//  * @param {string} userId - The user ID
//  * @returns {Promise<Object>} Result with streak info
//  */
// export const updateStreakForPost = async (userId) => {
//   try {
//     const streakData = await getUserStreak(userId);
//     const today = getTodayStringIST();
//     if (streakData.streak_completed_today) {
//       const { data: updated, error } = await supabase
//         .from('streaks')
//         .update({
//           daily_posts_count: (streakData.daily_posts_count || 0) + 1,
//           updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//         })
//         .eq('user_id', userId)
//         .select()
//         .single();
//       if (error) throw error;
//       return { ...updated, streakIncreased: false, alreadyCompleted: true };
//     }
//     const newCurrentStreak = streakData.current_streak + 1;
//     const newHighestStreak = Math.max(newCurrentStreak, streakData.highest_streak);
//     const { data: updated, error } = await supabase
//       .from('streaks')
//       .update({
//         current_streak: newCurrentStreak,
//         highest_streak: newHighestStreak,
//         last_activity_date: today,
//         daily_posts_count: (streakData.daily_posts_count || 0) + 1,
//         daily_comments_count: 0,
//         streak_completed_today: true,
//         updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//       })
//       .eq('user_id', userId)
//       .select()
//       .single();
//     if (error) throw error;
//     return {
//       ...updated,
//       streakIncreased: true,
//       previousStreak: streakData.current_streak,
//     };
//   } catch (error) {
//     console.error('Error updating streak for post:', error);
//     throw error;
//   }
// };

// /**
//  * Update streak when user comments (need 5 comments for streak)
//  * @param {string} userId - The user ID
//  * @param {string} postOwnerId - The post owner ID
//  * @returns {Promise<Object>} Result with streak info
//  */
// export const updateStreakForComment = async (userId, postOwnerId) => {
//   try {
//     if (userId === postOwnerId) {
//       return { streakIncreased: false, ownPost: true };
//     }
//     const streakData = await getUserStreak(userId);
//     const today = getTodayStringIST();
//     let newDailyComments = (streakData.daily_comments_count || 0) + 1;
//     let streakIncreased = false;
//     let newCurrentStreak = streakData.current_streak;
//     let newHighestStreak = streakData.highest_streak;
//     let streakCompletedToday = streakData.streak_completed_today;

//     if (streakData.last_activity_date === today && streakCompletedToday) {
//       const { data: updated, error } = await supabase
//         .from('streaks')
//         .update({
//           daily_comments_count: newDailyComments,
//           updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//         })
//         .eq('user_id', userId)
//         .select()
//         .single();
//       if (error) throw error;
//       return { ...updated, streakIncreased: false, commentsProgress: newDailyComments };
//     }

//     if (newDailyComments >= 5) {
//       newCurrentStreak += 1;
//       newHighestStreak = Math.max(newCurrentStreak, streakData.highest_streak || 0);
//       streakCompletedToday = true;
//       streakIncreased = true;
//     } else {
//       streakCompletedToday = false;
//     }

//     const { data: updated, error } = await supabase
//       .from('streaks')
//       .update({
//         current_streak: newCurrentStreak,
//         highest_streak: newHighestStreak,
//         last_activity_date: today,
//         daily_posts_count: 0,
//         daily_comments_count: newDailyComments,
//         streak_completed_today: streakCompletedToday,
//         updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//       })
//       .eq('user_id', userId)
//       .select()
//       .single();
//     if (error) throw error;
//     return {
//       ...updated,
//       streakIncreased: streakIncreased,
//       previousStreak: streakData.current_streak || 0,
//       commentsProgress: newDailyComments,
//     };
//   } catch (error) {
//     console.error('Error updating streak for comment:', error);
//     throw error;
//   }
// };

// /**
//  * Reset user's streak data
//  * @param {string} userId - The user ID
//  * @returns {Promise<Object>} Result with reset info
//  */
// export const resetUserStreak = async (userId) => {
//   try {
//     if (!userId) throw new Error('User ID is required');
//     const resetData = {
//       current_streak: 0,
//       last_activity_date: null,
//       daily_posts_count: 0,
//       daily_comments_count: 0,
//       streak_completed_today: false,
//       updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
//     };
//     const { data, error } = await supabase
//       .from('streaks')
//       .update(resetData)
//       .eq('user_id', userId)
//       .select()
//       .single();
//     if (error) throw error;
//     return { ...data, streakReset: true };
//   } catch (error) {
//     console.error('Error resetting user streak:', error);
//     throw error;
//   }
// };

// /**
//  * Subscribe to real-time streak changes
//  * @param {string} userId - The user ID
//  * @param {Function} callback - Callback function
//  * @returns {Object} Subscription object
//  */
// export const subscribeToStreakChanges = async (userId, callback) => {
//   return supabase
//     .channel(`streak_${userId}`)
//     .on('postgres_changes', {
//       event: 'UPDATE',
//       schema: 'public',
//       table: 'streaks',
//       filter: `user_id=eq.${userId}`
//     }, callback)
//     .subscribe();
// };

// /**
//  * Get today's progress
//  * @param {string} userId - The user ID
//  * @returns {Promise<Object>} Today's progress
//  */
// export const getTodayProgress = async (userId) => {
//   try {
//     const streakData = await getUserStreak(userId);
//     const today = getTodayStringIST();
    
//     const isToday = streakData.last_activity_date === today;
    
//     return {
//       currentStreak: streakData.current_streak || 0,
//       highestStreak: streakData.highest_streak || 0,
//       commentsToday: isToday ? (streakData.daily_comments_count || 0) : 0,
//       postsToday: isToday ? (streakData.daily_posts_count || 0) : 0,
//       streakCompletedToday: isToday && streakData.streak_completed_today,
//       commentsNeeded: Math.max(0, 5 - (isToday ? (streakData.daily_comments_count || 0) : 0)),
//     };
//   } catch (error) {
//     console.error('Error getting today progress:', error);
//     return {
//       currentStreak: 0,
//       highestStreak: 0,
//       commentsToday: 0,
//       postsToday: 0,
//       streakCompletedToday: false,
//       commentsNeeded: 5,
//     };
//   }
// };

// export default {
//   getUserStreak,
//   updateStreakForPost,
//   updateStreakForComment,
//   resetUserStreak,
//   subscribeToStreakChanges,
//   getTodayProgress,
// };

import { supabase } from '../config/supabaseConfig';
import { DateTime } from 'luxon';

/**
 * Simple and robust streak system
 * - 1 post per day OR 5 comments per day = streak increment
 * - Only once per day
 * - Simple date-based logic with IST timezone
 */

/**
 * Get today's date string in IST (YYYY-MM-DD)
 */
const getTodayStringIST = () => {
  return DateTime.now().setZone('Asia/Kolkata').toISODate();
};

/**
 * Get user's current streak data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The streak data
 */
export const getUserStreak = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const initialStreak = {
        user_id: userId,
        current_streak: 0,
        highest_streak: 0,
        last_activity_date: null,
        daily_posts_count: 0,
        daily_comments_count: 0,
        streak_completed_today: false,
        created_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
        updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
      };
      const { data: newStreak, error: insertError } = await supabase
        .from('streaks')
        .insert(initialStreak)
        .select()
        .single();
      if (insertError) throw insertError;
      return newStreak;
    }
    // --- AUTO-RESET LOGIC ---
    const now = DateTime.now().setZone('Asia/Kolkata');
    const today = now.startOf('day');
    const lastActivityDate = data.last_activity_date ? DateTime.fromISO(data.last_activity_date, { zone: 'Asia/Kolkata' }).startOf('day') : null;
    const yesterday = today.minus({ days: 1 });
    if (lastActivityDate && lastActivityDate < yesterday) {
      const resetData = {
        current_streak: 0,
        last_activity_date: null,
        daily_posts_count: 0,
        daily_comments_count: 0,
        streak_completed_today: false,
        updated_at: now.toISO(),
      };
      const { data: updatedStreak, error: updateError } = await supabase
        .from('streaks')
        .update(resetData)
        .eq('user_id', userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return { ...updatedStreak, streakReset: true };
    }
    return data;
  } catch (error) {
    console.error('Error getting user streak:', error);
    throw error;
  }
};

/**
 * Get streak leaderboard
 * @param {string} collegeName - Optional college filter
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Leaderboard data
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
          college
        )
      `)
      .order('current_streak', { ascending: false })
      .limit(limit);

   

    const { data, error } = await query;

    if (error) throw error;

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
 * Update streak when user creates a post
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Result with streak info
 */
export const updateStreakForPost = async (userId) => {
  try {
    const streakData = await getUserStreak(userId);
    const today = getTodayStringIST();
    if (streakData.streak_completed_today) {
      const { data: updated, error } = await supabase
        .from('streaks')
        .update({
          daily_posts_count: (streakData.daily_posts_count || 0) + 1,
          updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
        })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { ...updated, streakIncreased: false, alreadyCompleted: true };
    }
    const newCurrentStreak = streakData.current_streak + 1;
    const newHighestStreak = Math.max(newCurrentStreak, streakData.highest_streak);
    const { data: updated, error } = await supabase
      .from('streaks')
      .update({
        current_streak: newCurrentStreak,
        highest_streak: newHighestStreak,
        last_activity_date: today,
        daily_posts_count: (streakData.daily_posts_count || 0) + 1,
        daily_comments_count: 0,
        streak_completed_today: true,
        updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return {
      ...updated,
      streakIncreased: true,
      previousStreak: streakData.current_streak,
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
    if (userId === postOwnerId) {
      return { streakIncreased: false, ownPost: true };
    }
    const streakData = await getUserStreak(userId);
    const today = getTodayStringIST();
    let newDailyComments = (streakData.daily_comments_count || 0) + 1;
    let streakIncreased = false;
    let newCurrentStreak = streakData.current_streak;
    let newHighestStreak = streakData.highest_streak;
    let streakCompletedToday = streakData.streak_completed_today;

    if (streakData.last_activity_date === today && streakCompletedToday) {
      const { data: updated, error } = await supabase
        .from('streaks')
        .update({
          daily_comments_count: newDailyComments,
          updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
        })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { ...updated, streakIncreased: false, commentsProgress: newDailyComments };
    }

    if (newDailyComments >= 5) {
      newCurrentStreak += 1;
      newHighestStreak = Math.max(newCurrentStreak, streakData.highest_streak || 0);
      streakCompletedToday = true;
      streakIncreased = true;
    } else {
      streakCompletedToday = false;
    }

    const { data: updated, error } = await supabase
      .from('streaks')
      .update({
        current_streak: newCurrentStreak,
        highest_streak: newHighestStreak,
        last_activity_date: today,
        daily_posts_count: 0,
        daily_comments_count: newDailyComments,
        streak_completed_today: streakCompletedToday,
        updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return {
      ...updated,
      streakIncreased: streakIncreased,
      previousStreak: streakData.current_streak || 0,
      commentsProgress: newDailyComments,
    };
  } catch (error) {
    console.error('Error updating streak for comment:', error);
    throw error;
  }
};

/**
 * Reset user's streak data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Result with reset info
 */
export const resetUserStreak = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    const resetData = {
      current_streak: 0,
      last_activity_date: null,
      daily_posts_count: 0,
      daily_comments_count: 0,
      streak_completed_today: false,
      updated_at: DateTime.now().setZone('Asia/Kolkata').toISO(),
    };
    const { data, error } = await supabase
      .from('streaks')
      .update(resetData)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { ...data, streakReset: true };
  } catch (error) {
    console.error('Error resetting user streak:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time streak changes
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription object
 */
export const subscribeToStreakChanges = async (userId, callback) => {
  return supabase
    .channel(`streak_${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
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
    const today = getTodayStringIST();
    
    const isToday = streakData.last_activity_date === today;
    
    return {
      currentStreak: streakData.current_streak || 0,
      highestStreak: streakData.highest_streak || 0,
      commentsToday: isToday ? (streakData.daily_comments_count || 0) : 0,
      postsToday: isToday ? (streakData.daily_posts_count || 0) : 0,
      streakCompletedToday: isToday && streakData.streak_completed_today,
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
  resetUserStreak,
  subscribeToStreakChanges,
  getTodayProgress,
};