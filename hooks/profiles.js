import { supabase } from '../config/supabaseConfig';
// import { TablesInsert } from '@/types/supabase';

export const getProfileById = async (id) => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
    .throwOnError();

  return data;
};

export const checkUserCollegeSelection = async (userId) => {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('college')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking college selection:', error);
      return false;
    }

    // If college is a string or an object with a name property
    if (typeof data.college === 'string') {
      return !!data.college.trim();
    }
    if (typeof data.college === 'object' && data.college !== null) {
      return !!(data.college.name || data.college.college);
    }
    return false;
  } catch (err) {
    console.error('Exception in checkUserCollegeSelection:', err);
    return false;
  }
};

export const updateProfile = async (
  id,
  updatedProfile
) => {
  const { data } = await supabase
    .from('users')
    .update(updatedProfile)
    .eq('id', id)
    .throwOnError()
    .select('*')
    .single();

  return data;
};

export const checkProfileComplete = async (userId) => {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, username, branch, passout_year, college, interests')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }

    const hasBasicInfo = !!(data.full_name?.trim() && data.username?.trim());
    const hasInterests = data.interests?.length > 0;
    const collegeValue = typeof data.college === 'string' ? data.college : data.college?.name || data.college?.college || '';
    const hasEducation = !!(data.branch?.trim() && data.passout_year?.trim() && collegeValue);

    console.log('📊 Profile completion check:', {
      hasBasicInfo,
      hasInterests,
      hasEducation,
      fullName: !!data.full_name?.trim(),
      username: !!data.username?.trim(),
      interestsCount: data.interests?.length || 0,
      branch: !!data.branch?.trim(),
      passoutYear: !!data.passout_year?.trim(),
      college: !!collegeValue,
      overallComplete: hasBasicInfo && hasInterests && hasEducation
    });

    return hasBasicInfo && hasInterests && hasEducation;
  } catch (err) {
    console.error('Exception in checkProfileComplete:', err);
    return false;
  }
};
