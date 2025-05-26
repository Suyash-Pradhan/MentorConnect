
'use server';
/**
 * @fileOverview Service for managing mentorship requests in Firestore.
 */
import { db } from '@/lib/firebase';
import type { MentorshipRequest, Role } from '@/types';
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
  or
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

export async function createMentorshipRequest(requestData: Omit<MentorshipRequest, 'id' | 'requestedAt' | 'status'>): Promise<string> {
  try {
    const dataToSet = {
      ...convertDatesToTimestamps(requestData),
      status: 'pending' as MentorshipRequest['status'],
      requestedAt: serverTimestamp() as FieldValue,
    };
    const requestCollectionRef = collection(db, 'mentorshipRequests');
    const docRef = await addDoc(requestCollectionRef, dataToSet);
    return docRef.id;
  } catch (error) {
    console.error("Error creating mentorship request:", error);
    throw error;
  }
}

export async function getMentorshipRequestsForUser(userId: string, userRole: Role): Promise<MentorshipRequest[]> {
  if (!userId || !userRole) {
    console.error("getMentorshipRequestsForUser: userId and userRole are required");
    return [];
  }
  try {
    const requestsCollectionRef = collection(db, 'mentorshipRequests');
    let q;
    if (userRole === 'student') {
      q = query(requestsCollectionRef, where('studentId', '==', userId), orderBy('requestedAt', 'desc'));
    } else if (userRole === 'alumni') {
      q = query(requestsCollectionRef, where('alumniId', '==', userId), orderBy('requestedAt', 'desc'));
    } else {
      return []; // Or handle admin role if necessary
    }
    
    const querySnapshot = await getDocs(q);
    const requests: MentorshipRequest[] = [];
    querySnapshot.forEach((docSnap) => {
      requests.push({ id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as MentorshipRequest);
    });
    return requests;
  } catch (error) {
    console.error(`Error fetching mentorship requests for user ${userId} (${userRole}):`, error);
    throw error;
  }
}

export async function updateMentorshipRequestStatus(
  requestId: string,
  status: MentorshipRequest['status'],
  message?: string // Optional message, e.g., if 'messaged' status is used
): Promise<void> {
  if (!requestId) {
    console.error("updateMentorshipRequestStatus: requestId is required");
    throw new Error("Request ID is required to update status.");
  }
  try {
    const requestDocRef = doc(db, 'mentorshipRequests', requestId);
    const updateData: Partial<MentorshipRequest> & { respondedAt: FieldValue, alumniMessage?: string } = {
      status: status,
      respondedAt: serverTimestamp() as FieldValue,
    };
    if (message && status === 'messaged') { // Example: store message if status is 'messaged'
        updateData.alumniMessage = message; // Assuming 'alumniMessage' is a field on MentorshipRequest
    }
    await updateDoc(requestDocRef, updateData);
  } catch (error) {
    console.error("Error updating mentorship request status:", error);
    throw error;
  }
}

export async function getMentorshipRequestById(requestId: string): Promise<MentorshipRequest | null> {
  if (!requestId) {
    console.error("getMentorshipRequestById: requestId is required");
    return null;
  }
  try {
    const requestDocRef = doc(db, 'mentorshipRequests', requestId);
    const requestSnap = await getDoc(requestDocRef);

    if (requestSnap.exists()) {
      return { id: requestSnap.id, ...convertTimestampsToDates(requestSnap.data()) } as MentorshipRequest;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching mentorship request by ID:", error);
    throw error;
  }
}
