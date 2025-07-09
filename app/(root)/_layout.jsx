import { Redirect, Stack, Slot, useRouter } from "expo-router";
import { BackHandler,Text,View } from 'react-native';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

const Layout = () => {
  const { isAuthenticated, isProfileComplete } = useAuthStore();
  const router = useRouter();

  // useEffect(() => {
    // if (typeof isAuthenticated === 'undefined'){
    //   return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
    //     <Text>Loading... in root layout please wait</Text>
    //   </View>
    // }
    // if (!isAuthenticated) {
    //   router.replace('/(auth)/welcome');
    // } else if (!isProfileComplete) {
    //   router.replace('/(auth)/onboarding');
    // }
  // }, [isAuthenticated, isProfileComplete]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
     
      <Stack.Screen
        name="createpost"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
     
      <Stack.Screen
        name="[chatRoom]"
        options={{
          headerShown: false,
        }} />  
         <Stack.Screen
        name="groupRoom"
        options={{
          headerShown: false,
        }} />  
      <Stack.Screen
        name="editprofile" 
        options={{
          headerShown: false,
        }}
      />
        <Stack.Screen
        name="postDetailView" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile" 
        options={{
          headerShown: false,
        }}
      />
        <Stack.Screen
        name="search" 
        options={{
          headerShown: false,
        }}
      />
       <Stack.Screen
        name="settings" 
        options={{
          headerShown: false,
        }}
      />
       <Stack.Screen
        name="streak" 
        options={{
          headerShown: false,
        }}
      />
         {/* <Stack.Screen
        name="[jobDetailView]" 
        options={{
          headerShown: false,
        }}
      /> */}
          {/* <Stack.Screen
        name="drawer" 
        options={{
          headerShown: false,
        }}
      /> */}
    </Stack>
  );
};

export default Layout; 