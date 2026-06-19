import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  Firestore,
  query,
  where,
  Query,
  DocumentReference
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let firestoreDb: Firestore | null = null;
let authInstance: Auth | null = null;

export function initFirebase(): Firestore | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  if (!firestoreDb) {
    firestoreDb = getFirestore();
  }

  if (!authInstance) {
    authInstance = getAuth();
  }

  return firestoreDb;
}

export function getFirebaseAuth(): Auth | null {
  if (!authInstance) {
    initFirebase();
  }
  return authInstance;
}

export function isFirebaseEnabled(): boolean {
  return isFirebaseConfigured;
}

export async function getCollectionDocs<T>(collectionName: string): Promise<T[]> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() } as T));
}

export async function syncCollection<T extends { id: string }>(collectionName: string, items: T[]): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return;
  }

  await Promise.all(
    items.map(item => setDoc(doc(db, collectionName, item.id), item))
  );
}

export async function signInWithFirebaseEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }

  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function createUserWithFirebaseEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }

  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutFirebase() {
  const auth = getFirebaseAuth();
  if (!auth) {
    return;
  }
  await signOut(auth);
}

export async function saveStudentProfile(uid: string, studentData: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  await setDoc(doc(db, 'students', uid), {
    ...studentData,
    updatedAt: new Date().toISOString()
  });
}

export async function saveAssessment(assessment: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const assessmentId = assessment.id || `assessment_${Date.now()}`;
  await setDoc(doc(db, 'assessments', assessmentId), {
    ...assessment,
    createdAt: assessment.createdAt || new Date().toISOString(),
    studentId: assessment.studentId,
    timestamp: new Date().toISOString()
  });
}

export async function saveJournalEntry(entry: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const entryId = entry.id || `journal_${Date.now()}`;
  await setDoc(doc(db, 'journals', entryId), {
    ...entry,
    createdAt: entry.createdAt || new Date().toISOString(),
    studentId: entry.studentId,
    updatedAt: new Date().toISOString()
  });
}

export async function saveCriticalIncident(incident: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const incidentId = incident.id || `incident_${Date.now()}`;
  await setDoc(doc(db, 'incidents', incidentId), {
    ...incident,
    createdAt: incident.createdAt || new Date().toISOString(),
    studentId: incident.studentId,
    timestamp: new Date().toISOString()
  });
}

export async function saveAuditLog(log: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const logId = log.id || `audit_${Date.now()}`;
  await setDoc(doc(db, 'auditLogs', logId), {
    ...log,
    timestamp: log.timestamp || new Date().toISOString(),
    studentId: log.studentId
  });
}

export async function getStudentAssessments(studentId: string): Promise<any[]> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return [];
  }
  
  const snapshot = await getDocs(collection(db, 'assessments'));
  return snapshot.docs
    .map(docItem => ({ id: docItem.id, ...docItem.data() } as any))
    .filter((a: any) => a.studentId === studentId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getStudentJournals(studentId: string): Promise<any[]> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return [];
  }
  
  const snapshot = await getDocs(collection(db, 'journals'));
  return snapshot.docs
    .map(docItem => ({ id: docItem.id, ...docItem.data() } as any))
    .filter((j: any) => j.studentId === studentId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateJournalEntry(entryId: string, updates: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const docRef = doc(db, 'journals', entryId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await setDoc(docRef, {
      ...docSnap.data(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  // Soft delete - mark as deleted instead of removing
  const docRef = doc(db, 'journals', entryId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await setDoc(docRef, {
      ...docSnap.data(),
      deleted: true,
      deletedAt: new Date().toISOString()
    });
  }
}

export async function getStudentStressHistory(studentId: string): Promise<any[]> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return [];
  }
  
  const snapshot = await getDocs(collection(db, 'assessments'));
  return snapshot.docs
    .map(docItem => ({
      id: docItem.id,
      studentId: (docItem.data() as any).studentId,
      createdAt: (docItem.data() as any).createdAt,
      finalStressIndex: (docItem.data() as any).finalStressIndex || 0,
      riskLevel: (docItem.data() as any).riskLevel || 'Unknown'
    }))
    .filter((a: any) => a.studentId === studentId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function saveAdminProfile(uid: string, adminData: any): Promise<void> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  await setDoc(doc(db, 'admins', uid), adminData);
}

export async function getStudentProfile(uid: string): Promise<any> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return null;
  }
  
  const docSnapshot = await getDoc(doc(db, 'students', uid));
  return docSnapshot.exists() ? docSnapshot.data() : null;
}

export async function getAdminProfile(uid: string): Promise<any> {
  const db = firestoreDb || initFirebase();
  if (!db) {
    return null;
  }
  
  const docSnapshot = await getDoc(doc(db, 'admins', uid));
  return docSnapshot.exists() ? docSnapshot.data() : null;
}

export function onAuthStateChangedListener(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }
  
  return onAuthStateChanged(auth, callback);
}

export function getCurrentAuthUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser || null;
}

