
'use server';
/**
 * @fileOverview Service for managing posts and their comments/likes in Firestore.
 */
import { db } from '@/lib/firebase';
import type { Post, PostComment } from '@/types'; // Ensure PostComment is used for post comments
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  orderBy,
  limit as firestoreLimit,
  type FieldValue,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';

// Helper to convert Firestore Timestamps to Dates in a nested object
function convertTimestampsToDates(data: any): any {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] instanceof Timestamp) {
      newData[key] = newData[key].toDate();
    } else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
      newData[key] = convertTimestampsToDates(newData[key]);
    }
  }
  return newData;
}

function convertDatesToTimestamps(data: any): any {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] instanceof Date) {
      newData[key] = Timestamp.fromDate(newData[key] as Date);
    } else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
      newData[key] = convertDatesToTimestamps(newData[key]);
    }
  }
  return newData;
}


export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'likedBy'>): Promise<string> {
  try {
    const dataToSet = {
      ...convertDatesToTimestamps(postData),
      likesCount: 0,
      likedBy: [], // Initialize likedBy as an empty array
      commentsCount: 0,
      createdAt: serverTimestamp() as FieldValue,
      updatedAt: serverTimestamp() as FieldValue,
    };
    const postCollectionRef = collection(db, 'posts');
    const docRef = await addDoc(postCollectionRef, dataToSet);
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  if (!postId) {
    console.error("getPostById: postId is required");
    return null;
  }
  try {
    const postDocRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postDocRef);

    if (postSnap.exists()) {
      const data = postSnap.data();
      const postWithDates = convertTimestampsToDates(data) as Omit<Post, 'id'>;
      return { id: postSnap.id, ...postWithDates, likedBy: data.likedBy || [] }; // Ensure likedBy is always an array
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    throw error;
  }
}

export async function getAllPosts(options?: { limit?: number; tag?: string }): Promise<Post[]> {
  try {
    const postsCollectionRef = collection(db, 'posts');
    let qConditions = [orderBy('createdAt', 'desc')];

    if (options?.tag) {
      qConditions.unshift(where('tags', 'array-contains', options.tag));
      // IMPORTANT: This query (tags array-contains + orderBy createdAt)
      // will require a composite index in Firestore.
      // Firestore will provide an error message with a link to create it if missing.
      // Example: Fields: 'tags' (Array), 'createdAt' (Descending)
    }
    if (options?.limit) {
      qConditions.push(firestoreLimit(options.limit));
    }
    
    const q = query(postsCollectionRef, ...qConditions);
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      posts.push({ id: docSnap.id, ...convertTimestampsToDates(data), likedBy: data.likedBy || [] } as Post);
    });
    return posts;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    throw error;
  }
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  if (!authorId) {
    console.error("getPostsByAuthor: authorId is required");
    return [];
  }
  try {
    const postsCollectionRef = collection(db, 'posts');
    const q = query(postsCollectionRef, where('authorId', '==', authorId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((docSnap) => {
       const data = docSnap.data();
      posts.push({ id: docSnap.id, ...convertTimestampsToDates(data), likedBy: data.likedBy || [] } as Post);
    });
    return posts;
  } catch (error) {
    console.error(`Error fetching posts for author ${authorId}:`, error);
    throw error;
  }
}


export async function updatePost(postId: string, postData: Partial<Omit<Post, 'id' | 'createdAt'>>): Promise<void> {
  if (!postId) {
    console.error("updatePost: postId is required");
    throw new Error("Post ID is required to update post.");
  }
  try {
    const postDocRef = doc(db, 'posts', postId);
    const dataToUpdate = {
        ...convertDatesToTimestamps(postData),
        updatedAt: serverTimestamp() as FieldValue,
    };
    await updateDoc(postDocRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<void> {
  if (!postId) {
    console.error("deletePost: postId is required");
    throw new Error("Post ID is required to delete post.");
  }
  try {
    // TODO: Implement deletion of comments subcollection if posts are deleted (e.g., via a Cloud Function)
    const postDocRef = doc(db, 'posts', postId);
    await deleteDoc(postDocRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// --- Like Functionality ---
export async function toggleLikePost(postId: string, userId: string): Promise<void> {
  if (!postId || !userId) {
    throw new Error("Post ID and User ID are required to toggle like.");
  }
  const postDocRef = doc(db, 'posts', postId);
  try {
    const postSnap = await getDoc(postDocRef);
    if (!postSnap.exists()) {
      throw new Error("Post not found.");
    }
    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];

    let updateData;
    if (likedBy.includes(userId)) {
      // User has liked, so unlike
      updateData = {
        likedBy: arrayRemove(userId),
        likesCount: increment(-1)
      };
    } else {
      // User has not liked, so like
      updateData = {
        likedBy: arrayUnion(userId),
        likesCount: increment(1)
      };
    }
    await updateDoc(postDocRef, updateData);
  } catch (error) {
    console.error("Error toggling like on post:", error);
    throw error;
  }
}

// --- Comment Functionality ---
export async function addCommentToPost(
  postId: string,
  commentData: Omit<PostComment, 'id' | 'createdAt'>
): Promise<string> {
  if (!postId) {
    throw new Error("Post ID is required to add a comment.");
  }
  if (commentData.postId !== postId) {
      throw new Error("Comment data postId does not match postId parameter.");
  }
  const postDocRef = doc(db, 'posts', postId);
  const commentsCollectionRef = collection(db, 'posts', postId, 'comments');

  try {
    const dataToSet = {
      ...convertDatesToTimestamps(commentData),
      createdAt: serverTimestamp() as FieldValue,
    };
    const commentDocRef = await addDoc(commentsCollectionRef, dataToSet);

    // Atomically increment commentsCount on the post
    await updateDoc(postDocRef, {
      commentsCount: increment(1)
    });

    return commentDocRef.id;
  } catch (error) {
    console.error("Error adding comment to post:", error);
    throw error;
  }
}

export async function getCommentsForPost(postId: string): Promise<PostComment[]> {
  if (!postId) {
    console.error("getCommentsForPost: postId is required");
    return [];
  }
  try {
    const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const comments: PostComment[] = [];
    querySnapshot.forEach((docSnap) => {
      comments.push({ id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as PostComment);
    });
    return comments;
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    throw error;
  }
}
