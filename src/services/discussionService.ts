
'use server';
/**
 * @fileOverview Service for managing discussion threads and comments in Firestore.
 */
import { db } from '@/lib/firebase';
import type { DiscussionThread, Comment, Role } from '@/types';
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
  writeBatch,
  collectionGroup
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

export async function createDiscussionThread(threadData: Omit<DiscussionThread, 'id' | 'createdAt' | 'lastActivityAt' | 'commentsCount'>): Promise<string> {
  try {
    const dataToSet = {
      ...convertDatesToTimestamps(threadData),
      commentsCount: 0,
      createdAt: serverTimestamp() as FieldValue,
      lastActivityAt: serverTimestamp() as FieldValue,
    };
    const threadCollectionRef = collection(db, 'discussionThreads');
    const docRef = await addDoc(threadCollectionRef, dataToSet);
    return docRef.id;
  } catch (error) {
    console.error("Error creating discussion thread:", error);
    throw error;
  }
}

export async function getDiscussionThreadById(threadId: string): Promise<DiscussionThread | null> {
  if (!threadId) {
    console.error("getDiscussionThreadById: threadId is required");
    return null;
  }
  try {
    const threadDocRef = doc(db, 'discussionThreads', threadId);
    const threadSnap = await getDoc(threadDocRef);

    if (threadSnap.exists()) {
      const data = threadSnap.data();
      const threadWithDates = convertTimestampsToDates(data) as Omit<DiscussionThread, 'id'>;
      return { id: threadSnap.id, ...threadWithDates };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching discussion thread by ID:", error);
    throw error;
  }
}

export async function getAllDiscussionThreads(options?: { limit?: number }): Promise<DiscussionThread[]> {
  try {
    const threadsCollectionRef = collection(db, 'discussionThreads');
    let q = query(threadsCollectionRef, orderBy('lastActivityAt', 'desc'));

    if (options?.limit) {
      q = query(q, firestoreLimit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const threads: DiscussionThread[] = [];
    querySnapshot.forEach((docSnap) => {
      threads.push({ id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as DiscussionThread);
    });
    return threads;
  } catch (error) {
    console.error("Error fetching all discussion threads:", error);
    throw error;
  }
}

export async function addCommentToThread(threadId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<string> {
  if (!threadId) {
    console.error("addCommentToThread: threadId is required");
    throw new Error("Thread ID is required to add comment.");
  }
  try {
    const threadDocRef = doc(db, 'discussionThreads', threadId);
    const commentsCollectionRef = collection(threadDocRef, 'comments');
    
    const dataToSet = {
      ...convertDatesToTimestamps(commentData),
      createdAt: serverTimestamp() as FieldValue,
    };
    const commentDocRef = await addDoc(commentsCollectionRef, dataToSet);

    // Update lastActivityAt and commentsCount on the thread
    const threadSnap = await getDoc(threadDocRef);
    const currentCommentsCount = (threadSnap.data()?.commentsCount || 0) as number;

    await updateDoc(threadDocRef, {
      lastActivityAt: serverTimestamp() as FieldValue,
      commentsCount: currentCommentsCount + 1,
    });
    
    return commentDocRef.id;
  } catch (error) {
    console.error("Error adding comment to thread:", error);
    throw error;
  }
}

export async function getCommentsForThread(threadId: string): Promise<Comment[]> {
  if (!threadId) {
    console.error("getCommentsForThread: threadId is required");
    return [];
  }
  try {
    const commentsCollectionRef = collection(db, 'discussionThreads', threadId, 'comments');
    const q = query(commentsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    querySnapshot.forEach((docSnap) => {
      comments.push({ id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as Comment);
    });
    return comments;
  } catch (error) {
    console.error(`Error fetching comments for thread ${threadId}:`, error);
    throw error;
  }
}

export async function deleteDiscussionThread(threadId: string): Promise<void> {
  if (!threadId) {
    console.error("deleteDiscussionThread: threadId is required");
    throw new Error("Thread ID is required for deletion.");
  }
  try {
    const threadDocRef = doc(db, 'discussionThreads', threadId);
    // Optionally, delete all comments in a subcollection first (more complex, requires batch or recursive delete)
    // For simplicity, this example only deletes the thread document.
    // Deleting subcollections is best handled by a Firebase Cloud Function for cleanup.
    await deleteDoc(threadDocRef);
  } catch (error) {
    console.error("Error deleting discussion thread:", error);
    throw error;
  }
}

export async function getDiscussionThreadTitles(options?: { limit?: number }): Promise<string[]> {
  try {
    const threadsCollectionRef = collection(db, 'discussionThreads');
    let q = query(threadsCollectionRef, orderBy('lastActivityAt', 'desc'));

    if (options?.limit) {
      q = query(q, firestoreLimit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const titles: string[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Partial<DiscussionThread>; // Cast for title access
      if (data.title) {
        titles.push(data.title);
      }
    });
    return titles;
  } catch (error) {
    console.error("Error fetching discussion thread titles:", error);
    return []; // Return empty array on error for robust tool usage
  }
}
