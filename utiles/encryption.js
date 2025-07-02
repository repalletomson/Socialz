import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
// import * as SecureStore from 'expo-secure-store';
// import CryptoJS from 'crypto-js';

// Function to generate a random AES key (256-bit)
export const generateSecureKey = async () => {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(32); // 32 bytes for AES-256
      if (!randomBytes) {
        throw new Error('Failed to generate random bytes for secure key');
      }
      // Convert random bytes to Base64 encoded string for easy usage
      return CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(randomBytes));
    } catch (error) {
      console.error('Error generating secure key:', error);
      return null;
    }
  };

// Function to store the secure key in secure storage

// Store the secure key
export const storeSecureKey = async (key) => {
  try {
    await SecureStore.setItemAsync('secureKey', key);
    console.log('Secure key stored successfully!');
  } catch (error) {
    console.error('Error storing the secure key:', error);
  }
};

// Retrieve the secure key
export const retrieveSecureKey = async () => {
  try {
    const key = await SecureStore.getItemAsync('secureKey');
    if (key) {
      console.log('Secure key retrieved successfully!');
      return key;
    } else {
      console.error('Secure key not found!');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving secure key:', error);
    return null;
  }
};

// Function to encrypt a message using AES
export const encryptMessage = (message, secretKey) => {
//   const iv = CryptoJS.lib.WordArray.random(16); // Use CryptoJS IV
//   const encrypted = CryptoJS.AES.encrypt(message, CryptoJS.enc.Utf8.parse(secretKey), {
//     iv: iv,
//     mode: CryptoJS.mode.CBC,
//     padding: CryptoJS.pad.Pkcs7,
//   });

//   return JSON.stringify({
//     iv: CryptoJS.enc.Base64.stringify(iv),
//     ciphertext: encrypted.toString(),
//   });
return message
};

// Function to decrypt a message using AES
export const decryptMessage = (encryptedData, secretKey) => {
//   try {
//     const parsedData = JSON.parse(encryptedData);
//     const iv = CryptoJS.enc.Base64.parse(parsedData.iv);
//     const ciphertext = parsedData.ciphertext;

//     const decrypted = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(secretKey), {
//       iv: iv,
//       mode: CryptoJS.mode.CBC,
//       padding: CryptoJS.pad.Pkcs7,
//     });

//     return decrypted.toString(CryptoJS.enc.Utf8);
//   } catch (error) {
//     console.error('Decryption failed:', error);
//     return null;
//   }
return encryptedData
};



  
// export const decryptMessage = (encryptedData, key) => {
//   try {
//     const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
//       iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
//       mode: CryptoJS.mode.CBC,
//       padding: CryptoJS.pad.Pkcs7
//     });
//     return decrypted.toString(CryptoJS.enc.Utf8);
//   } catch (error) {
//     console.error('Decryption failed:', error);
//     return '[Message cannot be decrypted]';
//   }
// }
  
// };
// // import * as Crypto from 'expo-crypto';
// // import { Buffer } from 'buffer';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import CryptoJS from 'crypto-js'; // Using crypto-js instead of react-native-crypto-js

// // const ENCRYPTION_KEY_SIZE = 256;
// // const IV_SIZE = 128;

// // // Helper function to convert ArrayBuffer to hex string
// // const arrayBufferToHex = (buffer) => {
// //   return Array.from(new Uint8Array(buffer))
// //     .map(b => b.toString(16).padStart(2, '0'))
// //     .join('');
// // };

// // // Helper function to convert hex string to ArrayBuffer
// // const hexToArrayBuffer = (hex) => {
// //   const pairs = hex.match(/[\dA-F]{2}/gi);
// //   const integers = pairs.map(s => parseInt(s, 16));
// //   return new Uint8Array(integers).buffer;
// // };

// // export const generateAESKey = async () => {
// //   const randomBytes = await Crypto.getRandomBytesAsync(ENCRYPTION_KEY_SIZE / 8);
// //   return arrayBufferToHex(randomBytes);
// // };

// // export const generateIV = async () => {
// //   const randomBytes = await Crypto.getRandomBytesAsync(IV_SIZE / 8);
// //   return arrayBufferToHex(randomBytes);
// // };

// // export const encryptMessage = async (message, key) => {
// //   const iv = await generateIV();
  
// //   // Using CryptoJS for encryption
// //   const encrypted = CryptoJS.AES.encrypt(message, CryptoJS.enc.Hex.parse(key), {
// //     iv: CryptoJS.enc.Hex.parse(iv),
// //     mode: CryptoJS.mode.CBC,
// //     padding: CryptoJS.pad.Pkcs7
// //   });
  
// //   return {
// //     encrypted: encrypted.toString(),
// //     iv: iv
// //   };
// // };

// // export const decryptMessage = (encryptedData, key) => {
// //   try {
// //     const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, CryptoJS.enc.Hex.parse(key), {
// //       iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
// //       mode: CryptoJS.mode.CBC,
// //       padding: CryptoJS.pad.Pkcs7
// //     });
    
// //     return decrypted.toString(CryptoJS.enc.Utf8);
// //   } catch (error) {
// //     console.error('Decryption failed:', error);
// //     return '[Message cannot be decrypted]';
// //   }
// // };
// // import { NativeModules } from 'react-native';
// // const { RNRandomBytes } = NativeModules;

// // // Function to generate random bytes
// // const getRandomBytes = (length) => {
// //   return new Promise((resolve, reject) => {
// //     RNRandomBytes.randomBytes(length, (err, bytes) => {
// //       if (err) reject(err);
// //       else resolve(bytes);
// //     });
// //   });
// // };

// // // Generate a random AES key
// // export const generateAESKey = async () => {
// //   try {
// //     const bytes = await getRandomBytes(32); // 256 bits
// //     return Buffer.from(bytes, 'base64').toString('hex');
// //   } catch (error) {
// //     console.error('Error generating AES key:', error);
// //     throw new Error('Failed to generate encryption key');
// //   }
// // };

// // // Encrypt a message using AES
// // export const encryptMessage = async (message, key) => {
// //   try {
// //     // Generate IV (Initialization Vector)
// //     const iv = await getRandomBytes(16); // 128 bits
// //     const ivBuffer = Buffer.from(iv, 'base64');
    
// //     // Convert key from hex to buffer
// //     const keyBuffer = Buffer.from(key, 'hex');
    
// //     // Create cipher
// //     const cipher = require('crypto').createCipheriv(
// //       'aes-256-cbc',
// //       keyBuffer,
// //       ivBuffer
// //     );
    
// //     // Encrypt
// //     let encrypted = cipher.update(message, 'utf8', 'base64');
// //     encrypted += cipher.final('base64');
    
// //     return {
// //       encrypted,
// //       iv: ivBuffer.toString('base64')
// //     };
// //   } catch (error) {
// //     console.error('Error encrypting message:', error);
// //     throw new Error('Failed to encrypt message');
// //   }
// // };

// // // Decrypt a message using AES
// // export const decryptMessage = (encryptedData, key) => {
// //   try {
// //     // Convert key and IV from strings to buffers
// //     const keyBuffer = Buffer.from(key, 'hex');
// //     const ivBuffer = Buffer.from(encryptedData.iv, 'base64');
    
// //     // Create decipher
// //     const decipher = require('crypto').createDecipheriv(
// //       'aes-256-cbc',
// //       keyBuffer,
// //       ivBuffer
// //     );
    
// //     // Decrypt
// //     let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
// //     decrypted += decipher.final('utf8');
    
// //     return decrypted;
// //   } catch (error) {
// //     console.error('Error decrypting message:', error);
// //     throw new Error('Failed to decrypt message');
// //   }
// // };

// // // Generate RSA key pair
// // export const generateRSAKeyPair = () => {
// //   try {
// //     const { generateKeyPairSync } = require('crypto');
// //     const { privateKey, publicKey } = generateKeyPairSync('rsa', {
// //       modulusLength: 2048,
// //       publicKeyEncoding: {
// //         type: 'spki',
// //         format: 'pem'
// //       },
// //       privateKeyEncoding: {
// //         type: 'pkcs8',
// //         format: 'pem'
// //       }
// //     });
    
// //     return { privateKey, publicKey };
// //   } catch (error) {
// //     console.error('Error generating RSA key pair:', error);
// //     throw new Error('Failed to generate key pair');
// //   }
// // };

// // // Encrypt with RSA public key
// // export const encryptWithRSA = (data, publicKey) => {
// //   try {
// //     const { publicEncrypt } = require('crypto');
// //     const encrypted = publicEncrypt(
// //       {
// //         key: publicKey,
// //         padding: require('crypto').constants.RSA_PKCS1_OAEP_PADDING
// //       },
// //       Buffer.from(data)
// //     );
// //     return encrypted.toString('base64');
// //   } catch (error) {
// //     console.error('Error encrypting with RSA:', error);
// //     throw new Error('Failed to encrypt with public key');
// //   }
// // };

// // // Decrypt with RSA private key
// // export const decryptWithRSA = (encryptedData, privateKey) => {
// //   try {
// //     const { privateDecrypt } = require('crypto');
// //     const decrypted = privateDecrypt(
// //       {
// //         key: privateKey,
// //         padding: require('crypto').constants.RSA_PKCS1_OAEP_PADDING
// //       },
// //       Buffer.from(encryptedData, 'base64')
// //     );
// //     return decrypted.toString('utf8');
// //   } catch (error) {
// //     console.error('Error decrypting with RSA:', error);
// //     throw new Error('Failed to decrypt with private key');
// //   }
// // };

// // // Hash a string using SHA-256
// // export const hashString = (str) => {
// //   try {
// //     const hash = require('crypto').createHash('sha256');
// //     hash.update(str);
// //     return hash.digest('hex');
// //   } catch (error) {
// //     console.error('Error hashing string:', error);
// //     throw new Error('Failed to hash string');
// //   }
// // };

// // // Group encryption utilities
// // export const generateGroupKey = async () => {
// //   return await generateAESKey();
// // };

// // export const encryptGroupKey = async (groupKey, userPublicKey) => {
// //   return await encryptMessage(groupKey, userPublicKey);
// // };

// // export const distributeGroupKey = async (groupId, participants) => {
// //   const groupKey = await generateGroupKey();
  
// //   for (const userId of participants) {
// //     const userDoc = await firestore().collection('users').doc(userId).get();
// //     const userPublicKey = userDoc.data().publicKey;
    
// //     const encryptedKey = await encryptGroupKey(groupKey, userPublicKey);
    
// //     await firestore()
// //       .collection('groupKeys')
// //       .doc(groupId)
// //       .collection('keys')
// //       .doc(userId)
// //       .set({
// //         encryptedKey: encryptedKey.encrypted,
// //         iv: encryptedKey.iv
// //       });
// //   }
  
// //   return groupKey;
// // };

// utils/encryption.js
// import CryptoJS from 'crypto-js';

// export const generateEncryptionKey = () => {
//   return CryptoJS.lib.WordArray.random(256/8).toString();
// };

// export const encryptMessage = (message, key) => {
//   try {
//     const encrypted = CryptoJS.AES.encrypt(message, key).toString();
//     console.log('Encrypted message in encryption:', encrypted);
//     return encrypted;
//   } catch (error) {
//     console.error('Encryption error:', error);
//     throw new Error('Failed to encrypt message');
//   }
// };

// export const decryptMessage = (encryptedMessage, key) => {
//   try {
//     const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
//     return decrypted.toString(CryptoJS.enc.Utf8);
//   } catch (error) {
//     console.error('Decryption error:', error);
//     throw new Error('Failed to decrypt message');
//   }
// };

export const encryptChatKey = (chatKey) => {
  // In a real application, you would use the recipient's public key
  // This is a simplified version for demonstration
  return chatKey;
};

export const decryptChatKey = (encryptedChatKey) => {
  // In a real application, you would use the user's private key
  // This is a simplified version for demonstration
  return encryptedChatKey;

 }
