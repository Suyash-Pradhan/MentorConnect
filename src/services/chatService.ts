
'use server';
/**
 * @fileOverview Service for managing chat sessions and messages in Firestore.
 */
import { db, serverTimestamp, Timestamp, type FieldValue } from '@/lib/firebase';
import type { ChatMessage, ChatSession, Profile } from '@/types';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { getProfile } from './profileService'; // To fetch profile details for names/avatars

// Helper to convert Firestore Timestamps to Dates
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

/**
 * Gets an existing chat session between two users or creates a new one if none exists.
 * Participant IDs are stored sorted to ensure a canonical chat ID for any pair of users.
 */
export async function getOrCreateChat(studentId: string, alumniId: string): Promise<string> {
  if (!studentId || !alumniId) {
    throw new Error("Both studentId and alumniId are required.");
  }

  const participantIdsSorted = [studentId, alumniId].sort();
  const chatsRef = collection(db, 'chats');
  
  // Query for existing chat
  const q = query(
    chatsRef,
    where('participantIds', '==', participantIdsSorted)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Chat already exists
    return querySnapshot.docs[0].id;
  } else {
    // Create new chat
    // Fetch profiles to store names for easier display if needed
    const studentProfile = await getProfile(studentId);
    const alumniProfile = await getProfile(alumniId);

    const newChatData: Omit<ChatSession, 'id' | 'createdAt' | 'lastMessageAt' | 'lastMessageText' | 'lastMessageSenderId'> = {
      participantIds: participantIdsSorted,
      studentId: studentId,
      alumniId: alumniId,
      // You can add participantNames or avatars here if you want to denormalize
      // studentName: studentProfile?.name || "Student",
      // alumniName: alumniProfile?.name || "Alumni",
    };
    const chatDocRef = await addDoc(chatsRef, {
      ...newChatData,
      createdAt: serverTimestamp() as FieldValue,
      lastMessageAt: serverTimestamp() as FieldValue,
      lastMessageText: "Chat created.",
      lastMessageSenderId: "", // Or a system ID
    });
    return chatDocRef.id;
  }
}

export async function getChatSession(chatId: string): Promise<ChatSession | null> {
  if (!chatId) return null;
  const chatDocRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatDocRef);
  if (chatSnap.exists()) {
    return { id: chatSnap.id, ...convertTimestampsToDates(chatSnap.data()) } as ChatSession;
  }
  return null;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
): Promise<string> {
  if (!chatId || !senderId || !text.trim()) {
    throw new Error("Chat ID, Sender ID, and text are required.");
  }

  const chatDocRef = doc(db, 'chats', chatId);
  const messagesColRef = collection(chatDocRef, 'messages');
  
  // Fetch sender's profile for name and avatar for the message
  const senderProfile = await getProfile(senderId);

  const newMessageData: Omit<ChatMessage, 'id' | 'createdAt'> & { createdAt: FieldValue } = {
    chatId,
    senderId,
    senderName: senderProfile?.name || "User",
    senderAvatar: senderProfile?.avatarUrl,
    text: text.trim(),
    createdAt: serverTimestamp() as FieldValue,
  };

  const messageDocRef = await addDoc(messagesColRef, newMessageData);

  // Update lastMessageAt, lastMessageText and lastMessageSenderId on the parent chat document
  await updateDoc(chatDocRef, {
    lastMessageAt: serverTimestamp() as FieldValue,
    lastMessageText: text.trim(),
    lastMessageSenderId: senderId,
  });

  return messageDocRef.id;
}

export async function getMessages(chatId: string, count: number = 50): Promise<ChatMessage[]> {
  if (!chatId) return [];

  const messagesColRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesColRef, orderBy('createdAt', 'desc'), firestoreLimit(count));
  
  const querySnapshot = await getDocs(q);
  const messages: ChatMessage[] = [];
  
  querySnapshot.forEach(docSnap => {
    messages.push({ id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as ChatMessage);
  });

  return messages.reverse(); // Reverse to show oldest first for typical chat display
}

export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef,
        where('participantIds', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    querySnapshot.forEach(docSnap => {
        sessions.push({ id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as ChatSession);
    });
    return sessions;
}
