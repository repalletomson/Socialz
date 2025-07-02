
//   import { doc, updateDoc, getDoc,arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
// import { db, auth } from '../../config/firebaseConfig';
// export  const handleChatNavigation = async (recipientId) => {
//     try {
//       // Check existing chat
//       const chatsRef = collection(db, 'chats');
//       const q = query(
//         chatsRef,
//         where('participants', 'array-contains', auth?.currentUser?.uid)
//       );
//       const snapshot = await getDocs(q);
      
//       const existingChat = snapshot.docs.find(doc => 
//         doc.data().participants.includes(recipientId)
//       );

//       if (existingChat) {
//         router.push({
//           pathname: '/chatRoom',
//           params: { chatId: existingChat.id, recipientId }
//         });
//         return;
//       }

//       // Create new chat with encryption
//       const secretKey = await generateSecureKey();
//       const chatData = {
//         participants: [currentUser.uid, recipientId],
//         createdAt: new Date(),
//         lastMessageTime: new Date(),
//         encryptionKey: await encryptMessage(secretKey, secretKey)
//       };
      
//       const chatRef = await addDoc(chatsRef, chatData);
//       router.push({
//         pathname: '/chatRoom',
//         params: { chatId: chatRef.id, recipientId }
//       });
//       setSearchQuery('');
//     } catch (error) {
//       console.error('Error creating chat:', error);
//       Alert.alert('Error', 'Failed to create chat');
//     }
//   };



// export const blockUser = async (blockedUserId) => {
//   try {
//     const currentUserId = auth.currentUser?.uid;
//     if (!currentUserId) throw new Error('User not authenticated');

//     const currentUserRef = doc(db, 'users', currentUserId);
//     const blockedUserRef = doc(db, 'users', blockedUserId);

//     // Update current user's blocked list
//     await updateDoc(currentUserRef, {
//       blockedUsers: arrayUnion(blockedUserId)
//     });

//     // Optional: Notify blocked user
//     await updateDoc(blockedUserRef, {
//       blockedByUsers:arrayUnion(currentUserId)
//     });

//     return true;
//   } catch (error) {
//     console.error('Block user error:', error);
//     throw error;
//   }
// };

// export const unblockUser = async (unblockedUserId) => {
//   try {
//     const currentUserId = auth.currentUser?.uid;
//     if (!currentUserId) throw new Error('User not authenticated');

//     const currentUserRef = doc(db, 'users', currentUserId);

//     await updateDoc(currentUserRef, {
//       blockedUsers: arrayRemove(unblockedUserId)
//     });

//     return true;
//   } catch (error) {
//     console.error('Unblock user error:', error);
//     throw error;
//   }
// };

// export const checkBlockStatus = async (userId, potentialBlockerId) => {
//   try {
//     const userRef = doc(db, 'users', userId);
//     const userData = await getDoc(userRef);
    
//     return userData.data()?.blockedUsers?.includes(potentialBlockerId) || false;
//   } catch (error) {
//     console.error('Check block status error:', error);
//     return false;
//   }
// };
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';

// Block user
export const blockUser = async (userIdToBlock) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', currentUserId);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(userIdToBlock)
    });
    return true;
  } catch (error) {
    console.error('Block user error:', error);
    return false;
  }
};

// Unblock user
export const unblockUser = async (userIdToUnblock) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', currentUserId);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(userIdToUnblock)
    });
    return true;
  } catch (error) {
    console.error('Unblock user error:', error);
    return false;
  }
};

// Check block status
export const checkBlockStatus = async (userIdToCheck) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', currentUserId);
    const userDoc = await getDoc(userRef);
    const blockedUsers = userDoc.data()?.blockedUsers || [];
    
    return blockedUsers.includes(userIdToCheck);
  } catch (error) {
    console.error('Check block status error:', error);
    return false;
  }
};

// Create or get existing chat
export const createOrGetChat = async (recipientId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) throw new Error('User not authenticated');

    // Check for existing chat
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUserId)
    );
    const chatsSnapshot = await getDocs(chatsQuery);

    const existingChat = chatsSnapshot.docs.find(doc => 
      doc.data().participants.includes(recipientId)
    );

    if (existingChat) {
      return existingChat.id;
    }

    // Create new chat if no existing chat found
    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUserId, recipientId],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: null
    });

    return newChatRef.id;
  } catch (error) {
    console.error('Create or get chat error:', error);
    return null;
  }
};
const firebaseConfig = {
  apiKey: 'AIzaSyB0M2x6kKQq7rL0mH2w6gqZ1z4Yc2X',
  authDomain: 'student-connect-app-d52f1.firebaseapp.com',
  projectId: 'student-connect-app-d52f1', 
  storageBucket: 'student-connect-app-d52f1.appspot.com',
  messagingSenderId: '1076535842721', 
  appId: '1:1076535842721:web:89dfd4fca2335e1ba59de0',
  measurementId: 'G-6SK2ZWEMQW'
};
export default firebaseConfig;