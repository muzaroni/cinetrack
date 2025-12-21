
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Firestore
} from "firebase/firestore";
import { TVShowSeason } from "../types";
import { CONFIG } from "../config";

const firebaseConfig = CONFIG.FIREBASE;

/**
 * Validates the config and initializes Firebase.
 */
function initializeFirebase() {
  const isMissingConfig = !firebaseConfig.projectId || 
                         firebaseConfig.projectId === "FIREBASE_PROJECT_ID_PLACEHOLDER" || 
                         firebaseConfig.projectId === "";
  
  if (isMissingConfig) {
    console.warn("CineTrack: Firebase configuration is missing. Operating in offline mode.");
    return null;
  }
  
  try {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
  } catch (err) {
    console.error("CineTrack: Failed to initialize Firebase App", err);
    return null;
  }
}

const app: FirebaseApp | null = initializeFirebase();

// Initialize Firestore only if app is valid
export const db: Firestore | null = app ? getFirestore(app) : null;

// Export connection status for UI
export const isFirebaseConnected = !!db;

const COLLECTION_NAME = "shows";

/**
 * Subscribes to the shows collection and triggers a callback on changes.
 */
export const subscribeToShows = (callback: (shows: TVShowSeason[]) => void) => {
  if (!db) {
    return () => {};
  }

  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, 
    (snapshot) => {
      const shows = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TVShowSeason[];
      callback(shows);
    },
    (error) => {
      console.error("Firestore Subscription Error:", error);
    }
  );
};

/**
 * Saves or updates a show season in Firestore.
 */
export const saveShowToCloud = async (show: TVShowSeason) => {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const showRef = doc(db, COLLECTION_NAME, show.id);
    await setDoc(showRef, show);
  } catch (error) {
    console.error("Error saving show to Firestore:", error);
    throw error;
  }
};

/**
 * Deletes a show season from Firestore.
 */
export const deleteShowFromCloud = async (id: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const showRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(showRef);
  } catch (error) {
    console.error("Error deleting show from Firestore:", error);
    throw error;
  }
};
