import "server-only"
import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Parse the service account from environment variable
// It should be a JSON string of the entire Private Key file
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount
    : undefined;

if (!serviceAccount) {
    // Only warn here so build doesn't fail, but runtime will fail if used
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Auth will fail.");
}

const firebaseAdminConfig = {
    credential: cert(serviceAccount!),
};

// Initialize Firebase Admin (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseAdminConfig);
const adminAuth = getAuth(app);

export { adminAuth };
