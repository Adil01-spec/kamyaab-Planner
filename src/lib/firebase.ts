import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSq2m4VPn9DsGDeMrdOxrk8rW1JllSswU",
  authDomain: "kamyab-plan.firebaseapp.com",
  projectId: "kamyab-plan",
  storageBucket: "kamyab-plan.appspot.com",
  messagingSenderId: "761871754238",
  appId: "1:761871754238:web:c5dccbd5b871f0b4b896af",
};

// Validate Firebase config
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
requiredFields.forEach((field) => {
  if (!firebaseConfig[field]) {
    console.warn(`Firebase config missing required field: ${field}`);
  }
});

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log("Firebase initialized:", { projectId: firebaseConfig.projectId });

export const auth = getAuth(app);
export const db = getFirestore(app);
export { serverTimestamp };
