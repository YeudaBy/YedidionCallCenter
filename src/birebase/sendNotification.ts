import admin from "@/birebase/admin";
import {repo, withRemult} from "remult";
import {User} from "@/model/User";


const userRepo = repo(User)

const deleteInvalidToken = async (token: string) => {
    try {
        await withRemult(async (remult) => {
            const user = await userRepo.findFirst({fcmToken: token})
            if (user) {
                user.fcmToken = undefined
                await userRepo.save(user)
                console.log(`Deleted invalid token for user ${user.name}`);
            }
        })
    } catch (error) {
        console.error("Error deleting invalid token:", error);
    }
}


export const sendNotification = async (
    title: string,
    body: string,
    recipients: string[],
    data?: Record<string, string>
) => {
    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: recipients,
            notification: { title, body },
            data: data || {},
            webpush: {
                headers: {
                    Urgency: "high",
                },
                notification: {
                    icon: "/logo.jpg",
                    badge: "/badge.png",
                    requireInteraction: true,
                },
            },
        });

        console.log(`Sent! Success: ${response.successCount}, Failures: ${response.failureCount}`);

        // delete invalid tokens
        if (response.failureCount > 0) {
            response.responses.forEach((res, idx) => {
                if (!res.success) {

                    const error = res.error;
                    console.warn(`Failure sending notification to ${recipients[idx]}:`, error);

                    if (error && (error.code === "messaging/invalid-registration-token" ||
                        error.code === "messaging/registration-token-not-registered")) {
                        const invalidToken = recipients[idx];
                        deleteInvalidToken(invalidToken);
                    }
                }
            });
        }

    } catch (error) {
        console.error("Error sending notifications:", error);
    }
};
