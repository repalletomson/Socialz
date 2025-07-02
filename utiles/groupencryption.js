

// import { generateAESKey, encryptMessage, decryptMessage } from './encryption';

// export const generateGroupKey = () => {
//   return generateAESKey();
// };

// export const encryptGroupKey = (groupKey, userPublicKey) => {
//   return encryptMessage(groupKey, userPublicKey);
// };

// export const distributeGroupKey = async (groupId, participants) => {
//   const groupKey = generateGroupKey();
  
//   for (const userId of participants) {
//     const userDoc = await firestore().collection('users').doc(userId).get();
//     const userPublicKey = userDoc.data().publicKey;
    
//     const encryptedKey = encryptGroupKey(groupKey, userPublicKey);
    
//     await firestore()
//       .collection('groupKeys')
//       .doc(groupId)
//       .collection('keys')
//       .doc(userId)
//       .set({
//         encryptedKey: encryptedKey.encrypted,
//         iv: encryptedKey.iv
//       });
//   }
  
//   return groupKey;
// };