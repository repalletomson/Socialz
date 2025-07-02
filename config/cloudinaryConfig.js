// import { Cloudinary } from 'cloudinary-react-native';

// // import cloudinary from './cloudinaryConfig';
// import RNFS from 'react-native-fs';

// const CLOUDINARY_CONFIG = {
//   cloud_name: 'dau9ea66s', // Replace with your Cloudinary cloud name
//   api_key: '318966349221573', // Replace with your Cloudinary API key
//   api_secret: 'gtK9OQXrCHJImB6QYPEcUtbtYWw', // Replace with your Cloudinary API secret
//   upload_preset: 'YOUR_UPLOAD_PRESET', // Replace with your Cloudinary upload preset
// };

// const cloudinary = new Cloudinary({
//   cloud_name: CLOUDINARY_CONFIG.cloud_name,
//   api_key: CLOUDINARY_CONFIG.api_key,
//   api_secret: CLOUDINARY_CONFIG.api_secret,
// });

// export const uploadToCloudinary = async (fileUri, type = 'video') => {
//   try {
//     // Read the file as a base64 string
//     const fileBase64 = await RNFS.readFile(fileUri, 'base64');

//     // Upload the file to Cloudinary
//     const result = await cloudinary.upload(fileBase64, {
//       resource_type: type, // 'image' or 'video'
//       upload_preset: CLOUDINARY_CONFIG.upload_preset,
//     });

//     // Return the secure URL of the uploaded file
//     return result.secure_url;
//   } catch (error) {
//     console.error('Error uploading to Cloudinary:', error);
//     throw new Error('Failed to upload media');
//   }
// };

// // export const formatTimestamp = (timestamp) => {
// //     try {
// //         const date = new Date(timestamp);
// //         const now = new Date();
        
// //         // If it's today, show time
// //         if (date.toDateString() === now.toDateString()) {
// //             return format(date, 'h:mm a');
// //         }
        
// //         // If it's this year, show month and day
// //         if (date.getFullYear() === now.getFullYear()) {
// //             return format(date, 'MMM d');
// //         }
        
// //         // Otherwise show full date
// //         return format(date, 'MMM d, yyyy');
// //     } catch (error) {
// //         console.error('Error formatting timestamp:', error);
// //         return 'Invalid date';
// //     }
// // };


// // src/config/cloudinaryConfig.js

// cloudinary.config({
//   cloud_name: 'your-cloud-name',
//   api_key: '318966349221573',
//   api_secret: 'gtK9OQXrCHJImB6QYPEcUtbtYWw'
// });

// // Helper function to upload video to Cloudinary
// // export const uploadVideoToCloudinary = async (videoUri) => {
// //   try {
// //     const formData = new FormData();
// //     formData.append('file', {
// //       uri: videoUri,
// //       type: 'video/mp4',
// //       name: 'upload.mp4',
// //     });
// //     formData.append('upload_preset', 'your_upload_preset');

// //     const response = await fetch(
// //       `https://api.cloudinary.com/v1_1/your-cloud-name/video/upload`,
// //       {
// //         method: 'POST',
// //         body: formData,
// //       }
// //     );

// //     const data = await response.json();
// //     return data.secure_url;
// //   } catch (error) {
// //     console.error('Error uploading video:', error);
// //     throw error;
// //   }
// // };

// // Helper function to generate unique username
// export const generateUniqueUsername = (fullName) => {
//   const baseName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
//   const randomString = Math.random().toString(36).substring(2, 8);
//   return `${baseName}-${randomString}`;
// };

// // Helper function to format timestamp
// export const formatTimestamp = (timestamp) => {
//   const now = new Date();
//   const postDate = new Date(timestamp);
//   const diffTime = Math.abs(now - postDate);
//   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//   const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
//   const diffMinutes = Math.floor(diffTime / (1000 * 60));

//   if (diffDays > 0) return `${diffDays}d ago`;
//   if (diffHours > 0) return `${diffHours}h ago`;
//   if (diffMinutes > 0) return `${diffMinutes}m ago`;
//   return 'Just now';
// };