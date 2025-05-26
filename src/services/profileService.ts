
'use server';
/**
 * @fileOverview Service for managing user profiles in Firestore.
 *
 * - getProfile - Fetches a user profile.
 * - setProfile - Creates or updates a user profile.
 * - initializeRoleProfile - Initializes a basic profile structure based on role.
 * - getProfilesByRole - Fetches all user profiles matching a specific role.
 */
import { db } from '@/lib/firebase';
import type { Profile, StudentProfile, AlumniProfile, Role } from '@/types';
import { doc, getDoc, setDoc, Timestamp, serverTimestamp, type FieldValue, collection, query, where, getDocs } from 'firebase/firestore';

// Helper to convert Firestore Timestamps to Dates in a nested object
function convertTimestampsToDates(data: any): any {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] instanceof Timestamp) {
      newData[key] = newData[key].toDate();
    } else if (typeof newData[key] === 'object' && newData[key] !== null) {
      // Recursively convert for nested objects, but avoid arrays for now
      if (!Array.isArray(newData[key])) {
         newData[key] = convertTimestampsToDates(newData[key]);
      }
    }
  }
  return newData;
}

// Helper to convert Dates to Firestore Timestamps in a nested object
function convertDatesToTimestamps(data: any): any {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] instanceof Date) {
      newData[key] = Timestamp.fromDate(newData[key] as Date);
    } else if (typeof newData[key] === 'object' && newData[key] !== null) {
      // Recursively convert for nested objects, but avoid arrays for now
       if (!Array.isArray(newData[key])) {
        newData[key] = convertDatesToTimestamps(newData[key]);
       }
    }
  }
  return newData;
}


export async function getProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.error("getProfile: userId is required");
    return null;
  }
  try {
    const profileDocRef = doc(db, 'users', userId);
    const profileSnap = await getDoc(profileDocRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      // Convert Firestore Timestamps to JS Dates
      const profileWithDates = convertTimestampsToDates(data) as Profile;
      return { id: profileSnap.id, ...profileWithDates };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    // Optionally re-throw or return a specific error object
    throw error; 
  }
}

export async function setProfile(userId: string, profileData: Partial<Profile>): Promise<void> {
  if (!userId) {
    console.error("setProfile: userId is required");
    throw new Error("User ID is required to set profile.");
  }
  try {
    const profileDocRef = doc(db, 'users', userId);
    
    // Ensure createdAt is handled correctly
    let dataToSet: any = { ...profileData };
    if (!profileData.createdAt) {
      // If it's a new profile or createdAt is not set, use serverTimestamp
      // For updates, we assume createdAt would already exist from profileData if fetched before
      const existingProfile = await getDoc(profileDocRef);
      if (!existingProfile.exists()) {
        dataToSet.createdAt = serverTimestamp() as FieldValue; // Use FieldValue for server timestamp on create
      }
    }
    
    // Convert JS Dates to Firestore Timestamps before saving (excluding serverTimestamp)
    const dataWithTimestamps = convertDatesToTimestamps(dataToSet);

    await setDoc(profileDocRef, dataWithTimestamps, { merge: true });
  } catch (error) {
    console.error("Error setting profile:", error);
    throw error;
  }
}

// Initializes a basic profile structure based on role
export async function initializeRoleProfile(role: 'student' | 'alumni'): Promise<StudentProfile | AlumniProfile> {
  if (role === 'student') {
    return {
      college: '',
      year: 1,
      academicInterests: [],
      goals: '',
    };
  } else { // alumni
    return {
      jobTitle: '',
      company: '',
      skills: [],
      experienceYears: 0,
      education: '',
      industry: '',
    };
  }
}

export async function getProfilesByRole(role: Role): Promise<Profile[]> {
  if (!role) {
    console.error("getProfilesByRole: role is required");
    return [];
  }
  try {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const profiles: Profile[] = [];
    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...convertTimestampsToDates(doc.data()) } as Profile);
    });
    return profiles;
  } catch (error) {
    console.error(`Error fetching profiles for role ${role}:`, error);
    throw error; // Re-throw to be handled by caller
  }
}
