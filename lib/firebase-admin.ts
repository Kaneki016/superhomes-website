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

let app;

// Initialize Firebase Admin (Singleton pattern)
if (serviceAccount) {
    const firebaseAdminConfig = {
        credential: cert(serviceAccount),
    };
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseAdminConfig);
}

// Export auth (mock if not initialized)
const adminAuth = (app ? getAuth(app) : {
    verifyIdToken: async (token: string) => {
        throw new Error("Firebase Admin not initialized. Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
    }
}) as unknown as ReturnType<typeof getAuth>;

export { adminAuth };
