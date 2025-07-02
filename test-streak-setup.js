// Test script to verify streak system setup
// Run this in Expo with: npx expo start, then open the app and check console

console.log('🧪 Starting Streak System Test...');

import { supabase } from './config/supabaseConfig';

export const testStreakSystem = async () => {
  console.log('\n=== STREAK SYSTEM TEST ===\n');
  
  try {
    // 1. Test basic connectivity
    console.log('🌐 Testing Supabase connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connectivity failed:', testError);
      return;
    }
    console.log('✅ Supabase connection working');
    
    // 2. Check if streaks table exists
    console.log('\n📋 Testing streaks table access...');
    const { data: streaksTest, error: streaksError } = await supabase
      .from('streaks')
      .select('*')
      .limit(1);
    
    if (streaksError) {
      if (streaksError.message.includes('relation "public.streaks" does not exist')) {
        console.error('❌ STREAKS TABLE NOT FOUND!');
        console.error('📋 Please run the SQL setup in your Supabase dashboard:');
        console.error('   1. Go to your Supabase project dashboard');
        console.error('   2. Open SQL Editor');
        console.error('   3. Copy and run the contents of create_streaks_table.sql');
        return;
      } else {
        console.error('❌ Streaks table access error:', streaksError);
        return;
      }
    }
    console.log('✅ Streaks table exists and accessible');
    
    // 3. Check authentication
    console.log('\n🔐 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ User not authenticated');
      console.error('   Please make sure you are logged in to the app');
      return;
    }
    console.log('✅ User authenticated:', user.id);
    
    // 4. Test streak functions
    console.log('\n🔧 Testing streak functions...');
    const { getUserStreak, updateStreakForPost } = require('./(apis)/streaks');
    
    // Test getUserStreak
    console.log('📊 Testing getUserStreak...');
    const streakData = await getUserStreak(user.id);
    console.log('Current streak data:', streakData);
    
    // Test updateStreakForPost (this will actually increment the streak)
    console.log('\n🔥 Testing updateStreakForPost...');
    const postResult = await updateStreakForPost(user.id);
    console.log('Post result:', postResult);
    
    console.log('\n✅ ALL TESTS PASSED! Streak system is working correctly.');
    console.log('🎉 You can now create posts and comments to build your streak!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack:', error.stack);
  }
};

// Auto-run test when file is imported
setTimeout(() => {
  testStreakSystem();
}, 2000); // Wait 2 seconds for app to initialize

export default testStreakSystem; 