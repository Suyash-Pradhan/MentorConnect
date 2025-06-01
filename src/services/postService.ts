
'use server';
/**
 * @fileOverview Service for managing posts in Firestore.
 *
 * - createPost - Creates a new post.
 * - getPostById - Fetches a single post by its ID.
 * - getAllPosts - Fetches all posts, optionally paginated or limited.
 * - getPostsByAuthor - Fetches posts by a specific author.
 * - updatePost - Updates an existing post.
 * - deletePost - Deletes a post.
 */
import { db } from '@/lib/firebase';
import type { Post } from '@/types';
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
  type FieldValue
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


export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<string> {
  try {
    const dataToSet = {
      ...convertDatesToTimestamps(postData),
      likesCount: 0,
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
      return { id: postSnap.id, ...postWithDates };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    throw error;
  }
}

export async function getAllPosts(options?: { limit?: number }): Promise<Post[]> {
  try {
    const postsCollectionRef = collection(db, 'posts');
    let q = query(postsCollectionRef, orderBy('createdAt', 'desc'));

    if (options?.limit) {
      q = query(q, firestoreLimit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...convertTimestampsToDates(doc.data()) } as Post);
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
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...convertTimestampsToDates(doc.data()) } as Post);
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
    const postDocRef = doc(db, 'posts', postId);
    await deleteDoc(postDocRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

