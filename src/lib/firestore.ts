import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import type { AppStateV1 } from '../types';
import { db } from './firebase';
import { defaultSettings } from './plan';

const COLLECTION = 'userData';

async function getUserDocRef(userId: string) {
  return doc(db, COLLECTION, userId);
}

export async function loadUserState(userId: string): Promise<AppStateV1> {
  try {
    const docRef = await getUserDocRef(userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as AppStateV1;
      // 버전 및 구조 검증
      if (data.version === 1 && data.settings && data.logsByDate) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error loading user state:', error);
  }
  
  // 기본 상태 반환
  return {
    version: 1,
    settings: defaultSettings(),
    logsByDate: {},
  };
}

export async function saveUserState(
  userId: string,
  state: AppStateV1
): Promise<void> {
  try {
    const docRef = await getUserDocRef(userId);
    await setDoc(docRef, state, { merge: false });
  } catch (error) {
    console.error('Error saving user state:', error);
    throw error;
  }
}

export async function clearUserState(userId: string): Promise<void> {
  try {
    const docRef = await getUserDocRef(userId);
    await setDoc(
      docRef,
      {
        version: 1,
        settings: defaultSettings(),
        logsByDate: {},
      },
      { merge: false }
    );
  } catch (error) {
    console.error('Error clearing user state:', error);
    throw error;
  }
}
