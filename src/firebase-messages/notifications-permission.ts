import {getToken, messaging} from "./messaging";
import {remult, repo} from "remult";
import {User} from "@/model/User";

const userRepo = repo(User)

export enum RequestTokenResult {
    Success = "Success",
    PermissionDenied = "PermissionDenied",
    ServiceWorkerRegistrationFailed = "ServiceWorkerRegistrationFailed",
    TokenRetrievalFailed = "TokenRetrievalFailed",
    RemultUserNotFound = "RemultUserNotFound",
    Error = "Unknown error"
}

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            return RequestTokenResult.PermissionDenied;
        }

        const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
        );

        if (!registration) {
            return RequestTokenResult.ServiceWorkerRegistrationFailed;
        }

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            return RequestTokenResult.TokenRetrievalFailed;
        }

        console.log("Token:")
        console.log(token)

        if (remult.user) {
            const user = await userRepo.findId(remult.user.id)
            if (user) {
                user.fcmToken = token
                await userRepo.save(user)
            }
            return RequestTokenResult.Success;
        }
        return RequestTokenResult.RemultUserNotFound;

    } catch (error) {
        console.error("Error Requesting Notification Permission:", error);
        return RequestTokenResult.Error;
    }
};
