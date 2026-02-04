import { NextRequest, NextResponse } from "next/server";
import {sendNotification} from "@/firebase-messages/sendNotification";
import {NextApiResponse} from "next";

async function POST(req: NextRequest, res: NextApiResponse) {
    try {

        const { title, body, recipients } = req.body as unknown as {
            title: string;
            body: string;
            recipients: string[];
        }

        if (!title || !body || !recipients) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        await sendNotification(title, body, recipients);
        return res.status(200).json({ message: "Notification sent successfully" });

    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ error: "Failed to send notification" });
    }
}

export { POST };
export default POST;
