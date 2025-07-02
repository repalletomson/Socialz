import * as tus from 'tus-js-client';
import { supabase } from '../config/supabaseConfig';

const PROJECT_ID = 'vsupqohqsgmpvzaszmtb'; // Your Supabase project ID

// TUS Resumable Upload function for Supabase Storage
export const uploadImageWithTUS = async (imageUri, fileName, bucketName = 'user-uploads') => {
  // console.log('🚀 === INDIVIDUAL TUS UPLOAD STARTED ===');
  // console.log('🚀 Starting TUS resumable upload...');
  // console.log('📁 File:', fileName, 'to bucket:', bucketName);
  // console.log('📂 Image URI:', imageUri);
  
  try {
    // console.log('🔐 Getting Supabase auth session...');
    // Get current auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.warn('⚠️ No authenticated session found for TUS upload');
      console.log('Session error:', sessionError);
      console.log('Session data:', session);
      // For now, we'll try without auth since storage policies allow public uploads
    } else {
      console.log('✅ Found authenticated session for TUS upload');
      console.log('🔑 Access token length:', session.access_token.length);
    }
    
    console.log('📥 Fetching image data from URI...');
    // Read file and convert to blob
    const response = await fetch(imageUri);
    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
      throw new Error(`Failed to read image file: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('📦 Prepared blob:', blob.size, 'bytes, type:', blob.type);
    
    const tusEndpoint = `https://${PROJECT_ID}.supabase.co/storage/v1/upload/resumable`;
    console.log('🎯 TUS endpoint:', tusEndpoint);
    
    // Create TUS upload
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating TUS upload instance...');
      
      const upload = new tus.Upload(blob, {
        endpoint: tusEndpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000], // Retry delays in ms
        headers: {
          ...(session?.access_token && { 
            authorization: `Bearer ${session.access_token}` 
          }),
          'x-upsert': 'true', // Allow overwriting existing files
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Allow re-uploading same file
        metadata: {
          bucketName: bucketName,
          objectName: fileName,
          contentType: blob.type || 'image/jpeg',
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024, // 6MB chunks as required by Supabase
        onError: function (error) {
          console.error('❌ TUS upload failed:');
          console.error('❌ Error:', error);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error stack:', error.stack);
          reject(error);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
          console.log(`📊 Upload progress: ${percentage}% (${bytesUploaded}/${bytesTotal} bytes)`);
        },
        onSuccess: function () {
          console.log('✅ TUS upload completed successfully!');
          console.log('📥 Upload URL:', upload.url);
          
          // Generate public URL
          console.log('🔗 Generating public URL...');
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          
          console.log('🔗 Public URL data:', urlData);
          console.log('✅ === INDIVIDUAL TUS UPLOAD COMPLETED ===');
          
          resolve({
            success: true,
            publicUrl: urlData.publicUrl,
            uploadUrl: upload.url,
            fileName: fileName
          });
        },
      });
      // (NOBRIDGE) LOG  🖼️ No images found in post
      console.log('🔍 Checking for previous uploads...');
      // Check for previous uploads and resume if found
      upload.findPreviousUploads().then(function (previousUploads) {
        if (previousUploads.length) {
          console.log('🔄 Found previous upload, resuming...');
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        
        // Start the upload
        console.log('🚀 Starting TUS upload...');
        upload.start();
      }).catch(error => {
        console.error('❌ Error finding previous uploads:', error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ === INDIVIDUAL TUS UPLOAD FAILED ===');
    console.error('❌ TUS upload setup failed:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// Batch upload multiple images using TUS
export const uploadMultipleImagesWithTUS = async (imageUris, userUid) => {
  // console.log(`🎯 === BATCH TUS UPLOAD STARTED ===`);
  // console.log(`🎯 Starting batch TUS upload for ${imageUris.length} images...`);
  // console.log('🖼️ Image URIs to upload:', imageUris);
  // console.log('👤 User UID:', userUid);
  
  const uploadPromises = imageUris.map(async (imageUri, index) => {
    const fileName = `posts/${userUid}/${Date.now()}_${index}_${Math.random().toString(36).substring(7)}.jpg`;
    
    // console.log(`🚀 Starting upload ${index + 1}/${imageUris.length}:`);
    // console.log(`📁 File name: ${fileName}`);
    // console.log(`📂 Image URI: ${imageUri}`);
    
    try {
      const result = await uploadImageWithTUS(imageUri, fileName);
      console.log(`✅ Image ${index + 1}/${imageUris.length} uploaded successfully:`);
      console.log(`📸 Result:`, result);
      console.log(`🔗 Public URL: ${result.publicUrl}`);
      return result.publicUrl;
    } catch (error) {
      console.error(`❌ Image ${index + 1}/${imageUris.length} upload failed:`);
      console.error(`❌ Error:`, error);
      console.error(`❌ Error stack:`, error.stack);
      return null; // Return null for failed uploads
    }
  });
  
  console.log('⏳ Waiting for all uploads to complete...');
  
  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);
  
  console.log('📊 Upload results:', results);
  
  // Filter out failed uploads (null values)
  const successfulUrls = results.filter(url => url !== null);
  
  console.log(`🎉 === BATCH TUS UPLOAD COMPLETED ===`);
  console.log(`✅ Batch upload complete: ${successfulUrls.length}/${imageUris.length} images uploaded successfully`);
  console.log('🔗 Successful URLs:', successfulUrls);
  
  return successfulUrls;
}; 