import React, { useEffect } from 'react';
import { router } from 'expo-router';

// Redirect signup to signin since we now use unified OTP authentication
function SignUpRedirect() {
  useEffect(() => {
    // Immediately redirect to signin which handles both signup and signin
    router.replace('/(auth)/signin');
  }, []);

  return null; // Don't render anything, just redirect
}

export default SignUpRedirect;

