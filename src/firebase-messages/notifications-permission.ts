import {getToken, messaging} from "./messaging";
import {remult, repo} from "remult";
import {User} from "@/model/User";

const userRepo = repo(User)

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            return;
        }

        const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
        );

        if (!registration) {
            return;
        }

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            return;
        }

        console.log("Token:")
        console.log(token)

        if (remult.user) {
            const user = await userRepo.findId(remult.user.id)
            if (user) {
                user.fcmToken = token
                await userRepo.save(user)
            }
        }

    } catch (error) {
        console.error("Error Requesting Notification Permission:", error);
        return;
    }
};
