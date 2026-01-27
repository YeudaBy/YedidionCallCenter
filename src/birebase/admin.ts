import admin from "firebase-admin";
import settings from "./firebase-project-key.json";

const serviceAccount = settings as admin.ServiceAccount;

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin Initialized Successfully");
    } catch (error) {
        console.error("Firebase Admin Initialization Failed:", error);
    }
}

export default admin;
