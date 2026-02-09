import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase (Singleton pattern)
let app;
let auth: Auth;

try {
    // Check if config is valid (at least apiKey is required)
    if (!firebaseConfig.apiKey) {
        if (typeof window === 'undefined') {
            // Build-time / Server-side without keys: Mock to prevent crash
            console.warn("Firebase API Key missing (Server/Build). Using mock auth.");
            auth = {} as Auth;
        } else {
            // Client-side: Throw actual error or let initializeApp fail
            throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is missing");
        }
    } else {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback to prevent module import crash
    auth = {} as Auth;
}

// Use 'superhomes-otp' as user-facing name if possible, though mostly controlled in console
if (auth && auth.languageCode) {
    auth.languageCode = 'en';
}

export { auth };
