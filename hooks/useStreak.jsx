import { useState, useEffect, useRef } from 'react';
import { getUserStreak, subscribeToStreakChanges } from '../(apis)/streaks';
import { supabase } from '../config/supabaseConfig';

export const useStreak = (userId) => {
  const [currentStreak, setCurrentStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // Always set loading to false if no userId
    if (!userId) {
      if (isMounted.current) {
        setCurrentStreak(0);
        setLoading(false);
      }
      return;
    }

    let streakUnsubscribe;

    const fetchStreak = async () => {
      try {
        const streakData = await getUserStreak(userId);
        if (isMounted.current) {
          setCurrentStreak(streakData?.current_streak || 0);
          setLoading(false);
        }

        // Subscribe to real-time updates
        streakUnsubscribe = subscribeToStreakChanges(userId, (payload) => {
          if (isMounted.current && payload.new) {
            setCurrentStreak(payload.new.current_streak || 0);
          }
        });
      } catch (error) {
        console.error('Error fetching streak:', error);
        if (isMounted.current) {
          setCurrentStreak(0);
          setLoading(false);
        }
      }
    };

    fetchStreak();

    return () => {
      isMounted.current = false;
      if (streakUnsubscribe) {
        supabase.removeChannel(streakUnsubscribe);
      }
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return { currentStreak, loading };
};