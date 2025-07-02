import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
  } from 'react-native';
  import { MaterialIcons } from '@expo/vector-icons';
  import { Fonts, TextStyles } from '../constants/Fonts';

  const { width, height } = Dimensions.get('window');

export default function ChatRoomHeader  ({ item ,router}){

    return(
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      
      <View style={styles.userInfo}>
        <View style={styles.profileImage}>
          <Text style={styles.profileInitial}>{item.username?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{item.username}</Text>
      </View>
      
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="phone" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="videocam" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>

    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    keyboardAvoid: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#fff',
      height: Platform.OS === 'ios' ? 44 + 44 : 56,
    },
    backButton: {
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#eee',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    profileInitial: {
      fontSize: 18,
      fontFamily: 'GeneralSans-Semibold',
    },
    userName: {
      fontSize: 16,
      fontFamily: 'GeneralSans-Semibold',
    },
    headerIcons: {
      flexDirection: 'row',
    },
    iconButton: {
      marginLeft: 16,
    },
    messageList: {
      flex: 1,
      padding: 16,
    },
    messageContainer: {
      maxWidth: width * 0.7,
      marginVertical: 4,
      padding: 12,
      borderRadius: 16,
    },
    senderMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#f0f0f0',
    },
    receiverMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#eee',
    },
    messageText: {
      fontSize: 16,
      color: '#000',
    },
    messageTime: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      backgroundColor: '#fff',
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: '#f8f8f8',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 8 : 0,
      paddingBottom: Platform.OS === 'ios' ? 8 : 0,
      marginRight: 8,
      fontSize: 16,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });