// import React, { useEffect, useState, useRef, useMemo } from 'react';
// import { View, Text, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator, ScrollView, ImageBackground, Dimensions, Image } from 'react-native';
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
// import { useSafeNavigation } from '../../hooks/useSafeNavigation';
// import { getUserStreak, subscribeToStreakChanges, getStreakLeaderboard, getTodayProgress } from '../../(apis)/streaks';
// import { useAuthStore } from '../../stores/useAuthStore';
// import * as Progress from 'react-native-progress';
// import { supabase } from '../../config/supabaseConfig';
// import { Fonts, TextStyles } from '../../constants/Fonts';
// import { useFocusEffect } from '@react-navigation/native';
// import { scaleSize } from '../../utiles/common';

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// const COLORS = {
//   background: '#0D0D0D',
//   card: 'rgba(0, 0, 0, 0.85)',
//   cardBlur: 'rgba(0, 0, 0, 0.6)',
//   cardInner: 'rgba(20, 20, 20, 0.9)',
//   text: '#FFFFFF',
//   textSecondary: '#B8B8B8',
//   accent: '#DA70D6',  // Purple accent
//   accentLight: '#E6E6FA',  // Light lavender
//   border: 'rgba(218, 112, 214, 0.3)',  // Purple border
//   borderSecondary: 'rgba(255, 255, 255, 0.1)',
//   gradientStart: '#E6E6FA',  // Light lavender
//   gradientMiddle: '#DDA0DD',  // Plum
//   gradientEnd: '#DA70D6',     // Orchid
// };

// const TimeLeftCard = ({ timeLeft }) => (
//   <BlurView 
//     style={{
//       borderRadius: 20,
//       overflow: 'hidden',
//       width: '100%',
//       marginBottom: 20,
//       padding: 24,
//       alignItems: 'center',
//       elevation: 8,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.3,
//       shadowRadius: 10,
//     }}
//     intensity={50}
//     tint="dark"
//   >
//     <Text style={{ 
//       color: COLORS.textSecondary, 
//       fontSize: 14, 
//       fontFamily: Fonts.GeneralSans.Medium, 
//       marginBottom: 16,
//       textShadowColor: 'rgba(0, 0, 0, 0.5)',
//       textShadowOffset: { width: 0, height: 1 },
//       textShadowRadius: 3,
//     }}>
//       Time Left to Keep Streak
//     </Text>
//     <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
//       <Text style={{ 
//         color: COLORS.text, 
//         fontSize: 36, 
//         fontFamily: Fonts.GeneralSans.Bold,
//         textShadowColor: 'rgba(0, 0, 0, 0.7)',
//         textShadowOffset: { width: 0, height: 2 },
//         textShadowRadius: 4,
//       }}>
//         {String(timeLeft.hours).padStart(2, '0')}
//       </Text>
//       <Text style={{ color: COLORS.textSecondary, fontSize: 20, marginHorizontal: 4 }}>h</Text>
//       <Text style={{ 
//         color: COLORS.text, 
//         fontSize: 36, 
//         fontFamily: Fonts.GeneralSans.Bold,
//         textShadowColor: 'rgba(0, 0, 0, 0.7)',
//         textShadowOffset: { width: 0, height: 2 },
//         textShadowRadius: 4,
//       }}>
//         {String(timeLeft.minutes).padStart(2, '0')}
//       </Text>
//       <Text style={{ color: COLORS.textSecondary, fontSize: 20, marginHorizontal: 4 }}>m</Text>
//       <Text style={{ 
//         color: COLORS.text, 
//         fontSize: 36, 
//         fontFamily: Fonts.GeneralSans.Bold,
//         textShadowColor: 'rgba(0, 0, 0, 0.7)',
//         textShadowOffset: { width: 0, height: 2 },
//         textShadowRadius: 4,
//       }}>
//         {String(timeLeft.seconds).padStart(2, '0')}
//       </Text>
//       <Text style={{ color: COLORS.textSecondary, fontSize: 20, marginLeft: 4 }}>s</Text>
//     </View>
//   </BlurView>
// );

// const StreakCard = ({ currentStreak, highestStreak }) => (
//   <View style={{ alignItems: 'center', marginBottom: 24 }}>
//     <LinearGradient
//       colors={[COLORS.accent, '#D97706']}
//       style={{
//         width: 120,
//         height: 120,
//         borderRadius: 60,
//         alignItems: 'center',
//         justifyContent: 'center',
//         elevation: 8,
//         shadowColor: COLORS.accent,
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.4,
//         shadowRadius: 10,
//       }}
//     >
//       <MaterialCommunityIcons name="fire" size={48} color="#FFF" />
//     </LinearGradient>
    
//     {/* Current Streak */}
//     <Text style={{
//       color: COLORS.text,
//       fontSize: 48,
//       fontFamily: Fonts.GeneralSans.Bold,
//       marginTop: 24,
//       textShadowColor: 'rgba(0, 0, 0, 0.5)',
//       textShadowOffset: { width: 0, height: 2 },
//       textShadowRadius: 4,
//     }}>
//       {currentStreak}
//     </Text>
//     <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontFamily: Fonts.GeneralSans.Semibold, marginTop: 4 }}>
//       Current Streak
//     </Text>
    
//     {/* Highest Streak */}
//     {highestStreak > 0 && (
//       <View style={{ 
//         marginTop: 12, 
//         alignItems: 'center',
//         backgroundColor: 'rgba(218, 112, 214, 0.1)',
//         paddingHorizontal: 16,
//         paddingVertical: 8,
//         borderRadius: 20,
//         borderWidth: 1,
//         borderColor: 'rgba(218, 112, 214, 0.3)',
//       }}>
//         <Text style={{ color: COLORS.accent, fontSize: 24, fontFamily: Fonts.GeneralSans.Bold }}>
//           {highestStreak}
//         </Text>
//         <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontFamily: Fonts.GeneralSans.Medium }}>
//           Highest Streak
//         </Text>
//       </View>
//     )}
//   </View>
// );

// // const ProgressCard = ({ commentsCount, postsCount, streakCompletedToday }) => {
// //   const commentsProgress = useMemo(() => (commentsCount >= 5 ? 1 : commentsCount / 5), [commentsCount]);

// //   return (
// //     <View style={{
// //       backgroundColor: COLORS.card,
// //       padding: 20,
// //       borderRadius: 16,
// //       borderWidth: 1,
// //       borderColor: COLORS.border,
// //       width: '100%',
// //       marginBottom: 20,
// //     }}>
// //       <View style={{ marginBottom: 16 }}>
// //         <Text style={{ color: COLORS.text, fontSize: 18, fontFamily: 'GeneralSans-Bold', marginBottom: 8 }}>
// //           Today's Progress
// //         </Text>
        
// //         {streakCompletedToday ? (
// //           <View style={{ 
// //             backgroundColor: 'rgba(16, 185, 129, 0.2)', 
// //             padding: 12, 
// //             borderRadius: 12,
// //             borderWidth: 1,
// //             borderColor: 'rgba(16, 185, 129, 0.4)',
// //           }}>
// //             <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
// //               ✅ Streak Completed for Today!
// //             </Text>
// //           </View>
// //         ) : (
// //           <>
// //             <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 }}>
// //               Choose one to complete your streak:
// //             </Text>
            
// //             {/* Posts Option */}
// //             <View style={{ 
// //               flexDirection: 'row', 
// //               justifyContent: 'space-between', 
// //               alignItems: 'center', 
// //               marginBottom: 12,
// //               backgroundColor: postsCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
// //               padding: 12,
// //               borderRadius: 10,
// //             }}>
// //               <Text style={{ color: COLORS.text, fontSize: 16 }}>
// //                 📝 Create 1 Post
// //               </Text>
// //               <Text style={{ 
// //                 color: postsCount > 0 ? '#10B981' : COLORS.textSecondary, 
// //                 fontSize: 16, 
// //                 fontWeight: '600' 
// //               }}>
// //                 {postsCount > 0 ? '✅' : '0/1'}
// //               </Text>
// //             </View>
            
// //             {/* OR Divider */}
// //             <Text style={{ 
// //               color: COLORS.textSecondary, 
// //               fontSize: 14, 
// //               textAlign: 'center', 
// //               marginVertical: 8 
// //             }}>
// //               OR
// //             </Text>
            
// //             {/* Comments Option */}
// //             <View style={{ 
// //               backgroundColor: 'rgba(255, 255, 255, 0.05)',
// //               padding: 12,
// //               borderRadius: 10,
// //             }}>
// //               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
// //                 <Text style={{ color: COLORS.text, fontSize: 16 }}>
// //                   💬 Comment on Others' Posts
// //                 </Text>
// //                 <Text style={{ color: COLORS.accent, fontSize: 16, fontFamily: 'GeneralSans-Bold' }}>
// //                   {commentsCount}/5
// //                 </Text>
// //               </View>
// //               <Progress.Bar
// //                 progress={commentsProgress}
// //                 width={null}
// //                 height={8}
// //                 color={COLORS.accent}
// //                 unfilledColor="rgba(255, 255, 255, 0.2)"
// //                 borderWidth={0}
// //                 borderRadius={4}
// //               />
// //             </View>
// //                      </>
// //          )}
// //        </View>
// //     </View>
// //   );
// // };

// // const Spotlight = () => {
// //   const [topUsers, setTopUsers] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     setLoading(true);
// //     getStreakLeaderboard(10).then(users => {
// //       setTopUsers(users);
// //       setLoading(false);
// //     });
// //   }, []);

// //   if (loading) {
// //     return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 32 }} />;
// //   }
// // // console.log(topUsers)
  
// //   return (
// //     <View style={{ marginTop: 32, width: '100%' }}>
// //       <Text style={{
// //         ...TextStyles.h3,
// //         color: COLORS.accent,
// //         textAlign: 'center',
// //         marginBottom: 18,
// //         letterSpacing: 0.5,
// //       }}>
// //         Spotlight
// //       </Text>
// //       {topUsers.length === 0 ? (
// //         <Text style={{ ...TextStyles.body2, color: COLORS.textSecondary, textAlign: 'center' }}>No streaks yet.</Text>
// //       ) : (
// //         topUsers.map((user, idx) => (
// //           <View
// //             key={user.user_id}
// //             style={{
// //               flexDirection: 'row',
// //               alignItems: 'center',
// //               marginBottom: 12,
// //               backgroundColor: 'rgba(255, 255, 255, 0.05)',
// //               borderRadius: 16,
// //               paddingVertical: 16,
// //               paddingHorizontal: 20,
// //               borderWidth: 1,
// //               borderColor: 'rgba(255, 255, 255, 0.1)',
// //             }}
// //           >
// //             {/* Rank Number */}
// //             <View style={{
// //               width: 32,
// //               height: 32,
// //               borderRadius: 16,
// //               backgroundColor: idx === 0 ? COLORS.accent : 'rgba(255, 255, 255, 0.1)',
// //               justifyContent: 'center',
// //               alignItems: 'center',
// //               marginRight: 16,
// //             }}>
// //               <Text style={{
// //                 fontFamily: Fonts.GeneralSans.Bold,
// //                 fontSize: 16,
// //                 color: idx === 0 ? '#FFFFFF' : COLORS.text,
// //               }}>
// //                 {idx + 1}
// //               </Text>
// //             </View>

// //             {/* User Name */}
// //             <Text style={{
// //               flex: 1,
// //               fontFamily: Fonts.GeneralSans.Medium,
// //               fontSize: 17,
// //               color: COLORS.text,
// //               letterSpacing: 0.2,
// //             }} numberOfLines={1}>
// //               {user?.fullName || user?.full_name || user?.displayName || 'User'}
// //             </Text>

// //             {/* Fire Icon and Streak Count */}
// //             <View style={{ 
// //               flexDirection: 'row', 
// //               alignItems: 'center',
// //               backgroundColor: 'rgba(255, 255, 255, 0.08)',
// //               paddingHorizontal: 12,
// //               paddingVertical: 6,
// //               borderRadius: 20,
// //             }}>
// //               <MaterialCommunityIcons 
// //                 name="fire" 
// //                 size={18} 
// //                 color={COLORS.accent} 
// //                 style={{ marginRight: 6 }}
// //               />
// //               <Text style={{
// //                 fontFamily: Fonts.GeneralSans.Bold,
// //                 fontSize: 16,
// //                 color: COLORS.text,
// //               }}>
// //                 {user.current_streak}
// //               </Text>
// //             </View>
// //           </View>
// //         ))
// //       )}
// //     </View>
// //   );
// // };
// const Spotlight = () => {
//   const [topUsers, setTopUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchTopStreakUsers = async () => {
//       try {
//         const data = await getStreakLeaderboard(5);
//         setTopUsers(data || []);
//       } catch (error) {
//         console.error('Error fetching top streak users:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTopStreakUsers();
//   }, []);

//   const getPositionColors = (index) => {
//     switch (index) {
//       case 0: return { bg: 'rgba(255, 215, 0, 0.15)', border: '#FFD700', text: '#FFD700' };
//       case 1: return { bg: 'rgba(192, 192, 192, 0.15)', border: '#C0C0C0', text: '#C0C0C0' };
//       case 2: return { bg: 'rgba(205, 127, 50, 0.15)', border: '#CD7F32', text: '#CD7F32' };
//       default: return { bg: COLORS.cardInner, border: COLORS.border, text: COLORS.accent };
//     }
//   };

//   return (
//     <BlurView 
//       style={{
//         borderRadius: 24,
//         overflow: 'hidden',
//         width: '100%',
//         marginTop: 20,
//         elevation: 12,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.4,
//         shadowRadius: 15,
//       }}
//       intensity={60}
//       tint="dark"
//     >
//       <LinearGradient
//         colors={['rgba(0, 0, 0, 0.85)', 'rgba(30, 30, 30, 0.9)', 'rgba(0, 0, 0, 0.85)']}
//         style={{
//           padding: 24,
//         }}
//       >
//         {/* Header */}
//         <View style={{ 
//           alignItems: 'center', 
//           marginBottom: 24,
//           borderBottomWidth: 1,
//           borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//           paddingBottom: 16,
//         }}>
//           <Text style={{ 
//             color: COLORS.text, 
//             fontSize: 20, 
//             fontFamily: Fonts.GeneralSans.Bold, 
//             textAlign: 'center',
//             textShadowColor: 'rgba(0, 0, 0, 0.8)',
//             textShadowOffset: { width: 0, height: 2 },
//             textShadowRadius: 4,
//             letterSpacing: 0.5,
//           }}>
//             ✨ SPOTLIGHT
//           </Text>
//           <Text style={{
//             color: COLORS.textSecondary,
//             fontSize: 14,
//             marginTop: 4,
//             opacity: 0.8,
//           }}>
//             Featured top streakers
//           </Text>
//         </View>
        
//         {loading ? (
//           <View style={{ alignItems: 'center', paddingVertical: 20 }}>
//             <ActivityIndicator size="large" color={COLORS.accent} />
//           </View>
//         ) : topUsers.length > 0 ? (
//           <View style={{ gap: 16 }}>
//             {topUsers.map((user, index) => {
//               if (!user.current_streak || user.current_streak <= 0) return null;
//               const position = getPositionColors(index);
//               return (
//                 <BlurView
//                   key={index}
//                   style={{
//                     borderRadius: 16,
//                     overflow: 'hidden',
//                     borderWidth: 1,
//                     borderColor: position.border,
//                   }}
//                   intensity={30}
//                   tint="dark"
//                 >
//                   <LinearGradient
//                     colors={[position.bg, 'rgba(0, 0, 0, 0.3)']}
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       padding: 16,
//                     }}
//                   >
//                     {/* Position Number */}
//                     <View style={{
//                       width: 32,
//                       height: 32,
//                       borderRadius: 16,
//                       backgroundColor: position.bg,
//                       borderWidth: 2,
//                       borderColor: position.border,
//                       justifyContent: 'center',
//                       alignItems: 'center',
//                       marginRight: 12,
//                     }}>
//                       <Text style={{ 
//                         fontSize: 16, 
//                         fontFamily: Fonts.GeneralSans.Bold,
//                         color: position.text 
//                       }}>
//                         {index + 1}
//                       </Text>
//                     </View>
//                     {/* User Info */}
//                     <View style={{ flex: 1 }}>
//                       <Text style={{
//                         color: COLORS.text,
//                         fontSize: 16,
//                         fontFamily: Fonts.GeneralSans.Semibold,
//                         marginBottom: 2,
//                       }} numberOfLines={1}>
//                         {user.users?.full_name || 'Anonymous'}
//                       </Text>
//                       <Text style={{
//                         color: COLORS.textSecondary,
//                         fontSize: 12,
//                         opacity: 0.8,
//                       }}>
//                         @{user.users?.username || 'user'}
//                       </Text>
//                     </View>
//                     {/* Streak Info */}
//                     <View style={{ alignItems: 'center' }}>
//                       <Text style={{
//                         color: position.text,
//                         fontSize: 20,
//                         fontFamily: Fonts.GeneralSans.Bold,
//                         textShadowColor: 'rgba(0, 0, 0, 0.8)',
//                         textShadowOffset: { width: 0, height: 1 },
//                         textShadowRadius: 3,
//                       }}>
//                         {user.current_streak  || 0}
//                       </Text>
//                       <Text style={{
//                         color: COLORS.textSecondary,
//                         fontSize: 11,
//                         fontFamily: Fonts.GeneralSans.Medium,
//                         marginTop: 2,
//                       }}>
//                         current 🔥
//                       </Text>
//                       {user.highest_streak > 0 && (
//                         <Text style={{
//                           color: position.text,
//                           fontSize: 12,
//                           opacity: 0.7,
//                           marginTop: 2,
//                         }}>
//                           Best: {user.highest_streak}
//                         </Text>
//                       )}
//                     </View>
//                   </LinearGradient>
//                 </BlurView>
//               );
//             })}
//           </View>
//         ) : (
//           <View style={{ alignItems: 'center', paddingVertical: 20 }}>
//             <Text style={{
//               color: COLORS.textSecondary,
//               fontSize: 16,
//               textAlign: 'center',
//               opacity: 0.8,
//             }}>
//               No streak data available yet
//             </Text>
//             <Text style={{
//               color: COLORS.textSecondary,
//               fontSize: 14,
//               textAlign: 'center',
//               marginTop: 8,
//               opacity: 0.6,
//             }}>
//               Start posting to build your streak! 🔥
//             </Text>
//           </View>
//         )}
//       </LinearGradient>
//     </BlurView>
//   );
// };
// const StreakInfoCard = () => (
//   <BlurView 
//     style={{
//       borderRadius: 20,
//       overflow: 'hidden',
//       width: '100%',
//       marginTop: 20,
//       elevation: 6,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 3 },
//       shadowOpacity: 0.25,
//       shadowRadius: 8,
//     }}
//     intensity={45}
//     tint="dark"
//   >
//     <LinearGradient
//       colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)']}
//       style={{
//         padding: 20,
//       }}
//     >
//       <View style={{
//         borderWidth: 1,
//         borderColor: COLORS.border,
//         borderRadius: 16,
//         padding: 16,
//         backgroundColor: COLORS.cardInner,
//       }}>
//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           marginBottom: 12,
//         }}>
//           <View style={{
//             backgroundColor: 'rgba(218, 112, 214, 0.2)',
//             borderRadius: 20,
//             padding: 8,
//             marginRight: 12,
//             borderWidth: 1,
//             borderColor: 'rgba(218, 112, 214, 0.4)',
//           }}>
//             <MaterialCommunityIcons name="fire" size={20} color={COLORS.accent} />
//           </View>
//           <Text style={{ 
//             color: COLORS.text, 
//             fontSize: 16, 
//             fontFamily: Fonts.GeneralSans.Bold,
//           }}>
//             How Streaks Work
//           </Text>
//         </View>
        
//         <View style={{ gap: 8 }}>
//           <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
//             <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>📝</Text>
//             <Text style={{ 
//               flex: 1, 
//               color: COLORS.textSecondary, 
//               fontSize: 14, 
//               lineHeight: 20,
//             }}>
//               Create <Text style={{ color: COLORS.text, fontWeight: '600' }}>1 post</Text> per day to maintain your streak
//             </Text>
//           </View>
          
//           <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
//             <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>💬</Text>
//             <Text style={{ 
//               flex: 1, 
//               color: COLORS.textSecondary, 
//               fontSize: 14, 
//               lineHeight: 20,
//             }}>
//               OR comment on <Text style={{ color: COLORS.text, fontWeight: '600' }}>5 other users' posts</Text> per day
//             </Text>
//           </View>
          
//           <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
//             <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>⏰</Text>
//             <Text style={{ 
//               flex: 1, 
//               color: COLORS.textSecondary, 
//               fontSize: 14, 
//               lineHeight: 20,
//             }}>
//               Streak resets to <Text style={{ color: '#EF4444', fontWeight: '600' }}>0</Text> if you miss a day
//             </Text>
//           </View>
          
//           <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
//             <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>🏆</Text>
//             <Text style={{ 
//               flex: 1, 
//               color: COLORS.textSecondary, 
//               fontSize: 14, 
//               lineHeight: 20,
//             }}>
//               Your <Text style={{ color: COLORS.text, fontWeight: '600' }}>highest streak</Text> is always saved
//             </Text>
//           </View>
//         </View>
//       </View>
//     </LinearGradient>
//   </BlurView>
// );

// export default function StreakPage() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [streakData, setStreakData] = useState(null);
//   const [todayProgress, setTodayProgress] = useState(null);
//   const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
//   const { safeBack } = useSafeNavigation({});
//   const isMounted = useRef(true);

//   // Countdown timer effect
//   useEffect(() => {
//     isMounted.current = true;
//     const timer = setInterval(() => {
//       if (isMounted.current) {
//         const now = new Date();
//         const endOfDay = new Date(now);
//         endOfDay.setHours(23, 59, 59, 999);
        
//         const diff = endOfDay.getTime() - now.getTime();
//         const hours = Math.floor(diff / (1000 * 60 * 60));
//         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//         const seconds = Math.floor((diff % (1000 * 60)) / 1000);

//         setTimeLeft({ hours, minutes, seconds });
//       }
//     }, 1000);

//     return () => {
//       isMounted.current = false;
//       clearInterval(timer);
//     };
//   }, []);

//   // Fetch and subscribe to streak data
//   useEffect(() => {
//     let unsubscribe;
//     async function fetchAndSubscribe() {
//       if (!user?.id) {
//         setLoading(false);
//         return;
//       }

//       setLoading(true);
//       try {
//         const [initialData, progressData] = await Promise.all([
//           getUserStreak(user.id),
//           getTodayProgress(user.id),
//         ]);

//         if (isMounted.current) {
//           setStreakData(initialData);
//           setTodayProgress(progressData);
//         }

//         // Subscribe to real-time updates
//         unsubscribe = subscribeToStreakChanges(user.id, (payload) => {
//           if (isMounted.current && payload.new) {
//             setStreakData(payload.new);
//             // Refresh today's progress when streak updates
//             getTodayProgress(user.id).then(progress => {
//               if (isMounted.current) {
//                 setTodayProgress(progress);
//               }
//             });
//         });
//       } catch (e) {
//         console.error("Error fetching streak data:", e);
//       } finally {
//         if (isMounted.current) {
//           setLoading(false);
//         }
//       }
//     }

//     fetchAndSubscribe();

//     return () => {
//       if (unsubscribe) {
//         supabase.removeChannel(unsubscribe);
//       }
//     };
//   }, [user?.id]);

//   useEffect(() => {
//     async function fetchUser() {
//       setLoading(true);
//       const { data: { user: supaUser } } = await supabase.auth.getUser();
//       if (supaUser?.id) {
//         const { data, error } = await supabase.from('users').select('*').eq('id', supaUser.id).single();
//         if (!error && data) setUser(data);
//       }
//       setLoading(false);
//     }
//     fetchUser();
//   }, []);

//   if (loading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Loading...</Text></View>;

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Base dark background with purple tones */}
//       <LinearGradient 
//         colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']} 
//         style={{ 
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//         }}
//       />
      
//       {/* Purple gradient overlays - inspired by your image */}
//       <LinearGradient
//         colors={['rgba(139, 69, 197, 0.15)', 'transparent', 'rgba(67, 56, 202, 0.2)']}
//         style={{
//           position: 'absolute',
//           top: -100,
//           left: -50,
//           width: screenWidth * 1.5,
//           height: screenHeight * 0.7,
//           borderRadius: screenWidth,
//           transform: [{ rotate: '12deg' }],
//         }}
//       />
      
//       <LinearGradient
//         colors={['transparent', 'rgba(124, 58, 237, 0.12)', 'rgba(168, 85, 247, 0.08)']}
//         style={{
//           position: 'absolute',
//           top: screenHeight * 0.3,
//           right: -80,
//           width: screenWidth * 1.3,
//           height: screenHeight * 0.6,
//           borderRadius: screenWidth,
//           transform: [{ rotate: '-18deg' }],
//         }}
//       />

//       <LinearGradient
//         colors={['rgba(99, 102, 241, 0.1)', 'transparent', 'rgba(147, 51, 234, 0.15)']}
//         style={{
//           position: 'absolute',
//           bottom: -120,
//           left: -60,
//           width: screenWidth * 1.4,
//           height: screenHeight * 0.5,
//           borderRadius: screenWidth,
//           transform: [{ rotate: '25deg' }],
//         }}
//       />

//       {/* Subtle center accent gradient */}
//       <LinearGradient
//         colors={['transparent', 'rgba(79, 70, 229, 0.06)', 'transparent']}
//         style={{
//           position: 'absolute',
//           top: screenHeight * 0.15,
//           left: 0,
//           right: 0,
//           height: screenHeight * 0.3,
//         }}
//       />

//       {/* Main blur overlay */}
//       <BlurView 
//         style={{ flex: 1 }}
//         intensity={35}
//         tint="dark"
//       >
//         <SafeAreaView style={{ flex: 1 }}>
//           <StatusBar barStyle="light-content" />
          
//           {/* Header with blur background */}
//           <View style={{
//             borderRadius: 25,
//             overflow: 'hidden',
//             margin: 16,
//             marginBottom: 8,
//             elevation: 4,
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.3,
//             shadowRadius: 6,
//           }}>
//             <BlurView 
//               style={{
//                 flexDirection: 'row', 
//                 alignItems: 'center', 
//                 padding: 20,
//               }}
//               intensity={50}
//               tint="dark"
//             >
//               <LinearGradient
//                 colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']}
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   right: 0,
//                   bottom: 0,
//                 }}
//               />
//               <TouchableOpacity 
//                 onPress={safeBack} 
//                 style={{ 
//                   position: 'absolute', 
//                   left: 20, 
//                   zIndex: 2,
//                   backgroundColor: 'rgba(0, 0, 0, 0.6)',
//                   borderRadius: 20,
//                   padding: 8,
//                   borderWidth: 1,
//                   borderColor: COLORS.border,
//                 }}
//               >
//                 <Ionicons name="arrow-back" size={24} color={COLORS.text} />
//               </TouchableOpacity>
//               <Text style={{ 
//                 flex: 1, 
//                 textAlign: 'center', 
//                 color: COLORS.text, 
//                 fontSize: 22, 
//                 fontFamily: Fonts.GeneralSans.Bold,
//                 textShadowColor: 'rgba(0, 0, 0, 0.7)',
//                 textShadowOffset: { width: 0, height: 2 },
//                 textShadowRadius: 4,
//               }}>
//                 Your Streak
//               </Text>
//             </BlurView>
//           </View>

//           {loading ? (
//             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//               <View style={{
//                 backgroundColor: 'rgba(0, 0, 0, 0.8)',
//                 borderRadius: 50,
//                 padding: 20,
//                 borderWidth: 1,
//                 borderColor: COLORS.border,
//               }}>
//                 <ActivityIndicator size="large" color={COLORS.accent} />
//               </View>
//             </View>
//           ) : (
//             <ScrollView 
//               contentContainerStyle={{ 
//                 flexGrow: 1, 
//                 justifyContent: 'flex-start', 
//                 alignItems: 'center', 
//                 padding: 24,
//                 paddingTop: 12,
//               }}
//               showsVerticalScrollIndicator={false}
//             >
//               {/* Streak Card */}
//               <StreakCard currentStreak={streakData?.current_streak || 0} highestStreak={streakData?.highest_streak || 0} />

//               {/* Time Left Card */}
//               <TimeLeftCard timeLeft={timeLeft} />

//               {/* Spotlight/Leaderboard Section - styled and placed as in reference */}
//               <Spotlight />

//               {/* Info Card */}
//               <StreakInfoCard />
//             </ScrollView>
//           )}
//         </SafeAreaView>
//       </BlurView>
//     </View>
//   );
// }
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { getUserStreak, subscribeToStreakChanges, getStreakLeaderboard, getTodayProgress, resetUserStreak } from '../../(apis)/streaks';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../config/supabaseConfig';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { useFocusEffect } from '@react-navigation/native';
import { scaleSize } from '../../utiles/common';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const COLORS = {
  background: '#0D0D0D',
  card: 'rgba(0, 0, 0, 0.85)',
  cardBlur: 'rgba(0, 0, 0, 0.6)',
  cardInner: 'rgba(20, 20, 20, 0.9)',
  text: '#FFFFFF',
  textSecondary: '#B8B8B8',
  accent: '#DA70D6',
  accentLight: '#E6E6FA',
  border: 'rgba(218, 112, 214, 0.3)',
  borderSecondary: 'rgba(255, 255, 255, 0.1)',
  gradientStart: '#E6E6FA',
  gradientMiddle: '#DDA0DD',
  gradientEnd: '#DA70D6',
  error: '#EF4444',
};

const TimeLeftCard = ({ timeLeft }) => (
  <BlurView 
    style={{
      borderRadius: 20,
      overflow: 'hidden',
      width: '100%',
      marginBottom: 20,
      padding: 24,
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    }}
    intensity={50}
    tint="dark"
  >
    <Text style={{ 
      color: COLORS.textSecondary, 
      fontSize: 14, 
      fontFamily: Fonts.GeneralSans.Medium, 
      marginBottom: 16,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    }}>
      Time Left to Keep Streak
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ 
        color: COLORS.text, 
        fontSize: 36, 
        fontFamily: Fonts.GeneralSans.Bold,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }}>
        {String(timeLeft.hours).padStart(2, '0')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 20, marginHorizontal: 4 }}>h</Text>
      <Text style={{ 
        color: COLORS.text, 
        fontSize: 36, 
        fontFamily: Fonts.GeneralSans.Bold,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }}>
        {String(timeLeft.minutes).padStart(2, '0')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 20, marginHorizontal: 4 }}>m</Text>
      <Text style={{ 
        color: COLORS.text, 
        fontSize: 36, 
        fontFamily: Fonts.GeneralSans.Bold,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }}>
        {String(timeLeft.seconds).padStart(2, '0')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 20, marginLeft: 4 }}>s</Text>
    </View>
  </BlurView>
);

const StreakCard = ({ currentStreak, highestStreak }) => (
  <View style={{ alignItems: 'center', marginBottom: 24 }}>
    <LinearGradient
      colors={[COLORS.accent, '#D97706']}
      style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      }}
    >
      <MaterialCommunityIcons name="fire" size={48} color="#FFF" />
    </LinearGradient>
    
    <Text style={{
      color: COLORS.text,
      fontSize: 48,
      fontFamily: Fonts.GeneralSans.Bold,
      marginTop: 24,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    }}>
      {currentStreak}
    </Text>
    <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontFamily: Fonts.GeneralSans.Semibold, marginTop: 4 }}>
      Current Streak
    </Text>
    
    {highestStreak > 0 && (
      <View style={{ 
        marginTop: 12, 
        alignItems: 'center',
        backgroundColor: 'rgba(218, 112, 214, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(218, 112, 214, 0.3)',
      }}>
        <Text style={{ color: COLORS.accent, fontSize: 24, fontFamily: Fonts.GeneralSans.Bold }}>
          {highestStreak}
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontFamily: Fonts.GeneralSans.Medium }}>
          Highest Streak
        </Text>
      </View>
    )}
  </View>
);

const Spotlight = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopStreakUsers = async () => {
      try {
        const data = await getStreakLeaderboard(5);
        setTopUsers(data || []);
      } catch (error) {
        console.error('Error fetching top streak users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopStreakUsers();
  }, []);

  const getPositionColors = (index) => {
    switch (index) {
      case 0: return { bg: 'rgba(255, 215, 0, 0.15)', border: '#FFD700', text: '#FFD700' };
      case 1: return { bg: 'rgba(192, 192, 192, 0.15)', border: '#C0C0C0', text: '#C0C0C0' };
      case 2: return { bg: 'rgba(205, 127, 50, 0.15)', border: '#CD7F32', text: '#CD7F32' };
      default: return { bg: COLORS.cardInner, border: COLORS.border, text: COLORS.accent };
    }
  };

  return (
    <BlurView 
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        marginTop: 20,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      }}
      intensity={60}
      tint="dark"
    >
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.85)', 'rgba(30, 30, 30, 0.9)', 'rgba(0, 0, 0, 0.85)']}
        style={{
          padding: 24,
        }}
      >
        <View style={{ 
          alignItems: 'center', 
          marginBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: 16,
        }}>
          <Text style={{ 
            color: COLORS.text, 
            fontSize: 20, 
            fontFamily: Fonts.GeneralSans.Bold, 
            textAlign: 'center',
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
            letterSpacing: 0.5,
          }}>
            ✨ SPOTLIGHT
          </Text>
          <Text style={{
            color: COLORS.textSecondary,
            fontSize: 14,
            marginTop: 4,
            opacity: 0.8,
          }}>
            Featured top streakers
          </Text>
        </View>
        
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : topUsers.length > 0 ? (
          <View style={{ gap: 16 }}>
            {topUsers.map((user, index) => {
              if (!user.current_streak || user.current_streak <= 0) return null;
              const position = getPositionColors(index);
              return (
                <BlurView
                  key={index}
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: position.border,
                  }}
                  intensity={30}
                  tint="dark"
                >
                  <LinearGradient
                    colors={[position.bg, 'rgba(0, 0, 0, 0.3)']}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                    }}
                  >
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: position.bg,
                      borderWidth: 2,
                      borderColor: position.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontFamily: Fonts.GeneralSans.Bold,
                        color: position.text 
                      }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: COLORS.text,
                        fontSize: 16,
                        fontFamily: Fonts.GeneralSans.Semibold,
                        marginBottom: 2,
                      }} numberOfLines={1}>
                        {user.users?.full_name || 'Anonymous'}
                      </Text>
                      <Text style={{
                        color: COLORS.textSecondary,
                        fontSize: 12,
                        opacity: 0.8,
                      }}>
                        @{user.users?.username || 'user'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{
                        color: position.text,
                        fontSize: 20,
                        fontFamily: Fonts.GeneralSans.Bold,
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}>
                        {user.current_streak || 0}
                      </Text>
                      <Text style={{
                        color: COLORS.textSecondary,
                        fontSize: 11,
                        fontFamily: Fonts.GeneralSans.Medium,
                        marginTop: 2,
                      }}>
                        current 🔥
                      </Text>
                      {user.highest_streak > 0 && (
                        <Text style={{
                          color: position.text,
                          fontSize: 12,
                          opacity: 0.7,
                          marginTop: 2,
                        }}>
                          Best: {user.highest_streak}
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
                </BlurView>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{
              color: COLORS.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              opacity: 0.8,
            }}>
              No streak data available yet
            </Text>
            <Text style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
              opacity: 0.6,
            }}>
              Start posting to build your streak! 🔥
            </Text>
          </View>
        )}
      </LinearGradient>
    </BlurView>
  );
};

const StreakInfoCard = () => (
  <BlurView 
    style={{
      borderRadius: 20,
      overflow: 'hidden',
      width: '100%',
      marginTop: 20,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    }}
    intensity={45}
    tint="dark"
  >
    <LinearGradient
      colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)']}
      style={{
        padding: 20,
      }}
    >
      <View style={{
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
        backgroundColor: COLORS.cardInner,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <View style={{
            backgroundColor: 'rgba(218, 112, 214, 0.2)',
            borderRadius: 20,
            padding: 8,
            marginRight: 12,
            borderWidth: 1,
            borderColor: 'rgba(218, 112, 214, 0.4)',
          }}>
            <MaterialCommunityIcons name="fire" size={20} color={COLORS.accent} />
          </View>
          <Text style={{ 
            color: COLORS.text, 
            fontSize: 16, 
            fontFamily: Fonts.GeneralSans.Bold,
          }}>
            How Streaks Work
          </Text>
        </View>
        
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>📝</Text>
            <Text style={{ 
              flex: 1, 
              color: COLORS.textSecondary, 
              fontSize: 14, 
              lineHeight: 20,
            }}>
              Create <Text style={{ color: COLORS.text, fontWeight: '600' }}>1 post</Text> per day to maintain your streak
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>💬</Text>
            <Text style={{ 
              flex: 1, 
              color: COLORS.textSecondary, 
              fontSize: 14, 
              lineHeight: 20,
            }}>
              OR comment on <Text style={{ color: COLORS.text, fontWeight: '600' }}>5 other users' posts</Text> per day
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>⏰</Text>
            <Text style={{ 
              flex: 1, 
              color: COLORS.textSecondary, 
              fontSize: 14, 
              lineHeight: 20,
            }}>
              Streak resets to <Text style={{ color: '#EF4444', fontWeight: '600' }}>0</Text> if you miss a day
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ color: COLORS.accent, fontSize: 16, marginRight: 8 }}>🏆</Text>
            <Text style={{ 
              flex: 1, 
              color: COLORS.textSecondary, 
              fontSize: 14, 
              lineHeight: 20,
            }}>
              Your <Text style={{ color: COLORS.text, fontWeight: '600' }}>highest streak</Text> is always saved
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  </BlurView>
);

export default function StreakPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);
  const [todayProgress, setTodayProgress] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { safeBack } = useSafeNavigation({});
  const isMounted = useRef(true);
  const { user: authUser } = useAuthStore();

  // Countdown timer effect
  useEffect(() => {
    isMounted.current = true;
    const timer = setInterval(() => {
      if (isMounted.current) {
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        const diff = endOfDay.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, []);

  // Fetch and subscribe to streak data
  useEffect(() => {
    let unsubscribe;
    async function fetchAndSubscribe() {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [initialData, progressData] = await Promise.all([
          getUserStreak(authUser.id),
          getTodayProgress(authUser.id),
        ]);

        if (isMounted.current) {
          setStreakData(initialData);
          setTodayProgress(progressData);
        }

        unsubscribe = subscribeToStreakChanges(authUser.id, (payload) => {
          if (isMounted.current && payload.new) {
            setStreakData(payload.new);
            getTodayProgress(authUser.id).then(progress => {
              if (isMounted.current) {
                setTodayProgress(progress);
              }
            });
          }
        });
      } catch (e) {
        console.error('Error fetching streak data:', e);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    fetchAndSubscribe();

    return () => {
      if (unsubscribe) {
        supabase.removeChannel(unsubscribe);
      }
    };
  }, [authUser?.id]);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (supaUser?.id) {
        const { data, error } = await supabase.from('users').select('*').eq('id', supaUser.id).single();
        if (!error && data) setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  // Function to invoke resetInactiveStreaks
  const handleResetInactiveStreaks = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('resetInactiveStreaks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token || Deno.env.get('SUPABASE_ANON_KEY')}` },
      });

      if (response.error) throw new Error(response.error.message);

      const { success, resetCount } = response.data;
      if (success) {
        Alert.alert('Success', `Reset ${resetCount} inactive streaks.`);
        // Optionally refresh streak data
        const newStreakData = await getUserStreak(authUser.id);
        setStreakData(newStreakData);
      }
    } catch (error) {
      console.error('Error resetting inactive streaks:', error);
      Alert.alert('Error', 'Failed to reset inactive streaks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 50,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient 
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      <LinearGradient
        colors={['rgba(139, 69, 197, 0.15)', 'transparent', 'rgba(67, 56, 202, 0.2)']}
        style={{
          position: 'absolute',
          top: -100,
          left: -50,
          width: screenWidth * 1.5,
          height: screenHeight * 0.7,
          borderRadius: screenWidth,
          transform: [{ rotate: '12deg' }],
        }}
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(124, 58, 237, 0.12)', 'rgba(168, 85, 247, 0.08)']}
        style={{
          position: 'absolute',
          top: screenHeight * 0.3,
          right: -80,
          width: screenWidth * 1.3,
          height: screenHeight * 0.6,
          borderRadius: screenWidth,
          transform: [{ rotate: '-18deg' }],
        }}
      />

      <LinearGradient
        colors={['rgba(99, 102, 241, 0.1)', 'transparent', 'rgba(147, 51, 234, 0.15)']}
        style={{
          position: 'absolute',
          bottom: -120,
          left: -60,
          width: screenWidth * 1.4,
          height: screenHeight * 0.5,
          borderRadius: screenWidth,
          transform: [{ rotate: '25deg' }],
        }}
      />

      <LinearGradient
        colors={['transparent', 'rgba(79, 70, 229, 0.06)', 'transparent']}
        style={{
          position: 'absolute',
          top: screenHeight * 0.15,
          left: 0,
          right: 0,
          height: screenHeight * 0.3,
        }}
      />

      <BlurView 
        style={{ flex: 1 }}
        intensity={35}
        tint="dark"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" />
          
          <View style={{
            borderRadius: 25,
            overflow: 'hidden',
            margin: 16,
            marginBottom: 8,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}>
            <BlurView 
              style={{
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 20,
              }}
              intensity={50}
              tint="dark"
            >
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <TouchableOpacity 
                onPress={safeBack} 
                style={{ 
                  position: 'absolute', 
                  left: 20, 
                  zIndex: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: 20,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={{ 
                flex: 1, 
                textAlign: 'center', 
                color: COLORS.text, 
                fontSize: 22, 
                fontFamily: Fonts.GeneralSans.Bold,
                textShadowColor: 'rgba(0, 0, 0, 0.7)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                Your Streak
              </Text>
            </BlurView>
          </View>

            <ScrollView 
              contentContainerStyle={{ 
                flexGrow: 1, 
                justifyContent: 'flex-start', 
                alignItems: 'center', 
                padding: 24,
                paddingTop: 12,
              }}
              showsVerticalScrollIndicator={false}
            >
              <StreakCard currentStreak={streakData?.current_streak || 0} highestStreak={streakData?.highest_streak || 0} />

              <TimeLeftCard timeLeft={timeLeft} />

              <Spotlight />

              <StreakInfoCard />

            {/* Reset Inactive Streaks Button */}
           
            </ScrollView>
        </SafeAreaView>
      </BlurView>
    </View>
  );
}
