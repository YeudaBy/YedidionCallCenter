import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {firebaseApp} from "@/firebase-messages/init";

let messaging: ReturnType<typeof getMessaging>;

if (typeof window !== "undefined" && "navigator" in window) {
    messaging = getMessaging(firebaseApp);
}

export { messaging, getToken, onMessage };
