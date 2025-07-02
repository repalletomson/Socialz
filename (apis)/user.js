import { supabase } from '../config/supabaseConfig';

/**
 * Delete user account (calls Supabase Edge Function)
 * @param {string} userId - The user ID
 * @param {string} userEmail - The user email for verification
 * @param {boolean} confirmDelete - Confirmation flag
 * @returns {Promise<Object>} Result of the deletion
 */
export const deleteUserAccount = async (userId, userEmail, confirmDelete = false) => {
  try {
    console.log('🗑️ Starting account deletion process...');
    
    if (!userId || !userEmail) {
      throw new Error('User ID and email are required');
    }

    if (!confirmDelete) {
      throw new Error('Deletion must be confirmed');
    }

    // Get current session for auth token
    console.log('🔐 Getting user session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('User must be authenticated to delete account');
    }

    console.log('✅ User authenticated, calling smart-service function...');
    console.log(`📋 Request data: userId=${userId}, email=${userEmail}`);

    // Call the Edge Function (using your deployed function name)
    const { data, error } = await supabase.functions.invoke('smart-service', {
      body: {
        action: 'delete-user',
        userId,
        userEmail,
        confirmDelete
      }
    });

    console.log('📨 Edge function response:', { data, error });

    if (error) {
      console.error('❌ Edge function error:', error);
      
      // Try to provide more specific error messages
      if (error.message?.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      } else if (error.message?.includes('non-2xx')) {
        throw new Error('Server error: The deletion request was rejected. Please try again or contact support.');
      } else {
        throw new Error(error.message || 'Failed to delete account');
      }
    }

    if (!data) {
      throw new Error('No response from server');
    }

    if (!data.success) {
      console.error('❌ Deletion failed:', data.error);
      throw new Error(data.error || 'Account deletion failed');
    }

    console.log('🎉 Account deleted successfully:', data.message);
    return data;

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    throw error;
  }
};

/**
 * Get user profile data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - The user ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated profile data
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export default {
  deleteUserAccount,
  getUserProfile,
  updateUserProfile
}; 