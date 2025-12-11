import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSq2m4VPn9DsGDeMrdOxrk8rW1JllSswU",
  authDomain: "kamyab-plan.firebaseapp.com",
  projectId: "kamyab-plan",
  storageBucket: "kamyab-plan.appspot.com",
  messagingSenderId: "761871754238",
  appId: "1:761871754238:web:c2a8fa1c9358cc5eb896af",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { serverTimestamp };
