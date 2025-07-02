import { View, Text,KeyboardAvoidingView, Platform,ScrollView } from 'react-native'
import React, { Children } from 'react'


const ios=Platform.OS === 'ios'
export default function CustomKeyboard({children,inChat}) {
    let kavConfig={}
    let scrollViewConfig={}
    if (inChat) {
        kavConfig={keyboardVerticalOffset:90}
        scrollViewConfig={contentContainerStyle:{flex:1}}
    }
  return (
   <KeyboardAvoidingView  behavior={ios?'padding':'height'}
    style={{flex:1}}
    {...kavConfig}
   >
    <ScrollView  style={{flex:1}} bounces={false} showsVerticalScrollIndicator={false} 
      {...scrollViewConfig}>
        {children}
    </ScrollView>
   </KeyboardAvoidingView>
  )
}