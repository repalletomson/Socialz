import { collection, query, where, orderBy, addDoc, getDocs, doc, updateDoc, arrayUnion, getDoc, arrayRemove,increment ,deleteDoc, limit,serverTimestamp} from 'firebase/firestore';
// import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
// import { db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL,deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebaseConfig';
import { Alert } from 'react-native';
import { useAuth } from '../context/authContext';
// import firestore from '@react-native-firebase/firestore'
import { supabase, supabaseStorage } from '../config/supabaseConfig';
import { incrementUserStreak, updateUserActivityStreak } from './streaks';
import { uploadMultipleImagesWithTUS } from './tusUpload';

// Create a new post with Supabase
export async function createPost(postData, mediaFiles, user) {
  
  try {
    let imageUrls = [];
    
    // Check authentication first
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      console.error('❌ Authentication error:', authError);
      console.error('❌ No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    console.log('✅ Authenticated user ID:', currentUser.id);
    console.log('✅ Passed user ID:', user?.uid);

    // Upload multiple images using TUS resumable upload (more reliable)
    if (mediaFiles && Array.isArray(mediaFiles) && mediaFiles.length > 0) {
      try {
        // Use the new TUS upload method for better reliability
        imageUrls = await uploadMultipleImagesWithTUS(mediaFiles, user?.uid);
        
        // If no images were uploaded successfully, show a specific alert
        if (mediaFiles.length > 0 && imageUrls.length === 0) {
          Alert.alert(
            'Image Upload Failed', 
            'Unable to upload images using resumable upload. Your post will be created without images.',
            [{ text: 'OK', style: 'default' }]
          );
        } else if (imageUrls.length < mediaFiles.length) {
          Alert.alert(
            'Partial Upload Success', 
            `${imageUrls.length} out of ${mediaFiles.length} images were uploaded successfully.`,
            [{ text: 'Continue', style: 'default' }]
          );
        }
      } catch (uploadError) {
        Alert.alert(
          'Image Upload Error', 
          'There was an issue uploading your images. Your post will be created without images.',
          [{ text: 'OK', style: 'default' }]
        );
        
        // Reset imageUrls to empty array if upload fails
        imageUrls = [];
      }
    }

    // Create post object - use the authenticated user's ID
    const post = {
      user_id: currentUser.id,
      title: postData?.title,
      content: postData?.content,
      images: imageUrls,
      video_url: null,
      like_count: 0,
      comment_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // User info (denormalized for performance)
      user_name: user?.full_name || user?.fullName || 'Anonymous',
      user_avatar: user?.profile_image || user?.profileImage || 'https://via.placeholder.com/40',
    };

    // Insert post into Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    // Update user streak (ONLY ONCE PER DAY)
    try {
      const streakResult = await incrementUserStreak(user?.uid);
    } catch (streakError) {
      // Don't fail the post creation if streak update fails
    }

    // Call the send-notification edge function after post creation
    // try {
    //   const { data: notifData, error: notifError } = await supabase.functions.invoke('send-notification', {
    //     body: {
    //       table: 'posts',
    //       record: {
    //         user_id: post.user_id,
    //         // Add other fields if needed
    //       },
    //     },
    //   });
    //   if (notifError) {
    //     console.error('Notification error:', notifError);
    //   } else {
    //     console.log('Notification sent:', notifData);
    //   }
    // } catch (notifCatchError) {
    //   console.error('Error invoking notification function:', notifCatchError);
    // }

    return { id: data.id, ...data };

  } catch (error) {
    Alert.alert('Error', 'Failed to create post. Please try again.');
    throw error;
  }
}

// Get feed posts from Supabase
export const getFeedPosts = async () => {
  try {
    // console.log("📊 === GET FEED POSTS STARTED ===");
    // console.log("📊 Fetching feed posts from Supabase...");
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (
          full_name,
          profile_image,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // console.log(`✅ Fetched ${data.length} posts from database`);
    
    // Add debugging for images in posts
    const postsWithImages = data.filter(post => post.images && post.images.length > 0);
    // console.log(`🖼️ Posts with images: ${postsWithImages.length}/${data.length}`);
    
    // if (postsWithImages.length > 0) {
    //   console.log('🖼️ Sample posts with images:');
    //   postsWithImages.slice(0, 3).forEach((post, index) => {
    //     console.log(`🖼️ Post ${index + 1}:`, {
    //       id: post.id,
    //       content: post.content?.substring(0, 50) + '...',
    //       images: post.images,
    //       imageCount: post.images?.length || 0
    //     });
    //   });
    // } else {
    //   console.log('🖼️ No posts with images found');
    // }
    
    // console.log("✅ === GET FEED POSTS COMPLETED ===");
    return data || [];
  } catch (error) {
    return [];
  }
};

// Add comment to a post
export const addComment = async (postId, commentData, user) => {
  try {
    if (!postId || !commentData || !user) {
      return null;
    }

    const comment = {
      post_id: postId,
      user_id: user.uid,
      content: commentData.content,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      throw error;
    }
    // Update streak for comments (5 comments = 1 day streak)
    await updateUserActivityStreak(user.uid, 'comments');
    return data;

  } catch (error) {
    throw error;
  }
};

// Get comments for a post
export const getComments = async (postId) => {
  try {
    // Validate UUID format
    if (!isValidUUID(postId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (
          full_name,
          profile_image,
          username
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    return [];
  }
};

// Delete a comment
export const deleteComment = async (commentId, userId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure user can only delete their own comments

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Add like to post (with duplicate check)
export const addLike = async (postId, user) => {
  try {
    if (!postId || !user) {
      return null;
    }

    // Validate UUID format
    if (!isValidUUID(postId)) {
      return null;
    }

    // First check if user has already liked this post
    const existingLike = await hasUserLiked(postId, user.uid);
    if (existingLike) {
      return null; // Already liked, return null to indicate no change needed
    }

    const like = {
      post_id: postId,
      user_id: user.uid,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('likes')
      .insert(like)
      .select()
      .single();

    if (error) {
      // Handle duplicate key constraint specifically
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Remove like from post
export const removeLike = async (postId, user) => {
  try {
    if (!postId || !user) {
      return null;
    }

    // Validate UUID format
    if (!isValidUUID(postId)) {
      return null;
    }

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.uid);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Get likes for a post
export const getLikes = async (postId) => {
  try {
    // Validate UUID format
    if (!isValidUUID(postId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('likes')
      .select(`
        *,
        users:user_id (
          full_name,
          profile_image,
          username
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    return [];
  }
};

// Delete post with images
export const deletePost = async (postId, userId) => {
  try {
    // Validate UUID format
    if (!isValidUUID(postId)) {
      return false;
    }

    // First get the post to check ownership and get image URLs
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, images')
      .eq('id', postId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Check if user owns the post
    if (post.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }

    // Delete images from storage if they exist
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      for (const imageUrl of post.images) {
        try {
          // Extract file path from URL for Supabase storage
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const folderPath = `posts/${fileName}`;

          const { error: storageError } = await supabase.storage
            .from('user-uploads')
            .remove([folderPath]);

          if (storageError) {
            // Log but don't fail the deletion
          }
        } catch (imageError) {
          // Continue with post deletion even if image deletion fails
        }
      }
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Report post
export const reportPost = async (postId, userId, reason, additionalInfo = '') => {
  try {
    const report = {
      post_id: postId,
      reporter_id: userId,
      reason: reason,
      additional_info: additionalInfo,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('post_reports')
      .insert(report)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Check if user has saved a post
export const hasUserSaved = async (postId, userId) => {
  try {
    // Validate UUID format
    if (!isValidUUID(postId)) {
      return false;
    }

    const { data, error } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    return false;
  }
};

// Save post
export const savePost = async (postId, userId) => {
  try {
    // First check if already saved
    const alreadySaved = await hasUserSaved(postId, userId);
    if (alreadySaved) {
      return null; // Already saved
    }

    const save = {
      post_id: postId,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('saved_posts')
      .insert(save)
      .select()
      .single();

    if (error) {
      // Handle duplicate key constraint specifically
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Unsave post
export const unsavePost = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Get saved posts for user
export const getSavedPosts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        *,
        posts:post_id (
          *,
          users:user_id (
            full_name,
            profile_image,
            username
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Extract posts from the relationship
    return data?.map(save => save.posts).filter(post => post) || [];
  } catch (error) {
    return [];
  }
};

// Check if user has liked a post
export const hasUserLiked = async (postId, userId) => {
  try {
    // Validate UUID format
    if (!isValidUUID(postId)) {
      return false;
    }

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    return false;
  }
};

// Get views for a post
export const getViews = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('post_views')
      .select('*')
      .eq('post_id', postId);

    if (error) {
      throw error;
    }

    return data?.length || 0;
  } catch (error) {
    return 0;
  }
};

// Increment views for a post
export const incrementViews = async (postId, userId) => {
  try {
    // Not implemented yet
    return 0;
  } catch (error) {
    return 0;
  }
};

// Get share count for a post
export const getShareCount = async (postId) => {
  return 0; // Not implemented yet
};

// Increment share count for a post
export const incrementShareCount = async (postId) => {
  try {
    // Not implemented yet
    return 0;
  } catch (error) {
    return 0;
  }
};

// Utility function to validate UUID format
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Legacy exports for backward compatibility
export const handleReportPost = reportPost;
export const handleDeletePost = deletePost;



// const handleDeletePost = async (postId) => {
//     try {
//       // Delete associated likes
//       const likesSnapshot = await firestore().collection("likes").where("postId", "==", postId).get();
//       const batch = firestore().batch();
//       likesSnapshot.forEach((doc) => batch.delete(doc.ref));
//       await batch.commit();
  
//       // Delete associated saves
//       const savesSnapshot = await firestore().collection("savedPosts").where("postId", "==", postId).get();
//       const saveBatch = firestore().batch();
//       savesSnapshot.forEach((doc) => saveBatch.delete(doc.ref));
//       await saveBatch.commit();
  
//       // Delete associated reports
//       const reportsSnapshot = await firestore().collection("reports").where("postId", "==", postId).get();
//       const reportBatch = firestore().batch();
//       reportsSnapshot.forEach((doc) => reportBatch.delete(doc.ref));
//       await reportBatch.commit();
  
//       // Delete the post
//       await firestore().collection("posts").doc(postId).delete();
//     } catch (error) {
//       console.error("Error deleting post:", error);
//       throw error;
//     }
//   };
  
//   /** Report a post to Firestore */
//    const handleReportPost = async (postId, userId, reason) => {
//     try {
//       await firestore().collection("reports").add({
//         reported_by: userId,
//         postId: postId,
//         reason: reason,
//         timestamp: firestore.FieldValue.serverTimestamp(),
//       });
//     } catch (error) {
//       console.error("Error reporting post:", error);
//       throw error;
//     }
//   };
  
//   /** Save a post to Firestore */
//    const handleSavePost = async (postId, userId) => {
//     try {
//       await firestore().collection("savedPosts").add({
//         userId: userId,
//         postId: postId,
//         timestamp: firestore.FieldValue.serverTimestamp(),
//       });
//     } catch (error) {
//       console.error("Error saving post:", error);
//       throw error;
//     }
//   };
  
//   /** Unsave a post from Firestore */
//    const handleUnsavePost = async (postId, userId) => {
//     try {
//       const snapshot = await firestore()
//         .collection("savedPosts")
//         .where("userId", "==", userId)
//         .where("postId", "==", postId)
//         .get();
//       const batch = firestore().batch();
//       snapshot.forEach((doc) => batch.delete(doc.ref));
//       await batch.commit();
//     } catch (error) {
//       console.error("Error unsaving post:", error);
//       throw error;
//     }
//   };
  
//   /** Get all saved posts for a user */
//    const getSavedPosts = async (userId) => {
//     try {
//       const snapshot = await firestore()
//         .collection("savedPosts")
//         .where("userId", "==", userId)
//         .get();
//       const savedPosts = [];
//       for (const doc of snapshot.docs) {
//         const postData = await firestore().collection("posts").doc(doc.data().postId).get();
//         if (postData.exists) {
//           savedPosts.push({ id: postData.id, ...postData.data() });
//         }
//       }
//       return savedPosts;
//     } catch (error) {
//       console.error("Error fetching saved posts:", error);
//       throw error;
//     }
//   };
  
//   /** Add a comment to a post */
//  const addComment = async (postId, commentData) => {
//     try {
//       await firestore()
//         .collection("posts")
//         .doc(postId)
//         .collection("comments")
//         .add(commentData);
//     } catch (error) {
//       console.error("Error adding comment:", error);
//       throw error;
//     }
//   };
  