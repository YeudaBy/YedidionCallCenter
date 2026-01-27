import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {firebaseApp} from "@/birebase/init";

let messaging: ReturnType<typeof getMessaging>;

if (typeof window !== "undefined" && "navigator" in window) {
    messaging = getMessaging(firebaseApp);
}

export { messaging, getToken, onMessage };
