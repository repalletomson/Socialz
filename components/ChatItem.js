// import { View, Text, TouchableOpacity } from 'react-native'
// import React from 'react'
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import {Image}from 'expo-image';
// import { blurhash } from '../utiles/blurhash';
// export default function ChatItem({item,router,noBoarder}) {
//     const handleChatRoom=()=>{
//         router.push({pathname:'/chatRoom',params:item})
//     }
//   return (
//    <TouchableOpacity  className='flex-row items-center gap-3 mb-4 pb-2 border-neutral-400' onPress={handleChatRoom}>
//  <Image source={{uri:item?.profileUrl}} style={{height:hp(6),width:wp(6)}} className='rounded-full'placeholder={blurhash} />
//  <View className='flex-1 gap-1'>
// <View className='flex-row justify-between'>
//   <Text className='font-bold'>{item.username}</Text>
//   <Text className='text-neutral-500'>Time</Text>
//   </View>
//   <Text className='text-neutral-400'>Last message</Text>
//  </View>
//    </TouchableOpacity>
//   )
// }
// ChatItem.js
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Image } from 'expo-image';
import { blurhash } from '../utiles/common';
// import { useRouter } from 'expo-router';

export default function ChatItem({ item, router, noBorder }) {
    // const router = useRouter();
  const handleChatRoom = () => {
    // console.log("item", item);
    router.push({ pathname: '/chatRoom', params: item });
  };
// console.log(ChatItem)
  return (
    <TouchableOpacity 
      className={`flex-row items-center gap-3 space-x-4 px-4 py-3 ${
        !noBorder && 'border-b border-neutral-200'
      }`}
      onPress={handleChatRoom}
    >
      <Image 
        source={{ uri: item?.profileUrl }} 
        style={{ height: hp(6.5), width: wp(13) ,borderRadius: hp(6.5) }}   
        className="rounded-full  text-white"
        placeholder={blurhash}
        contentFit="cover"
      />
      
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold text-neutral-800">
            {item.username}
          </Text>
          <Text className="text-xs text-indico-500">
            {item.time || '12:00 PM'}
          </Text>
        </View>
        
        <Text 
          className="text-sm text-neutral-500 mt-1"
          numberOfLines={1}
        >
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
// isCloseToBottom