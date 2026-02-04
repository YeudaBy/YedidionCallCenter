import admin from "@/birebase/admin";


export const sendNotification = async (
    title: string,
    body: string,
    recipients: string[]
) => {
    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: recipients,
            notification: { title, body },
        });

        console.log(
            `Notification sent! Success: ${response.successCount}, Failures: ${response.failureCount}`
        );

        if (response.failureCount > 0) {
            response.responses.forEach((res, index) => {
                if (
                    !res.success &&
                    res.error?.code === "messaging/registration-token-not-registered"
                ) {
                    console.warn(`Invalid token found: ${recipients[index]}`);
                }
            });
        }
    } catch (error) {
        console.error("Error sending notifications:", error);
    }
};
