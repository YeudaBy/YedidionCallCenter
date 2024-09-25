import {WaTextMessage} from "@/model/wa/WaTextMessage";

export interface IWhatsAppManager {
    getUserNumber(req: any): Promise<string>;

    getUserText(req: any): Promise<string>;

    sendTextMessage(textMessage: WaTextMessage): Promise<string | undefined>;

    reactToTextMessage(to: string, message_id: string, emoji: string): Promise<void>;

    sendMediaMessage(number: string, mediaUrl: string): Promise<void>;
}

class WhatsAppManager implements IWhatsAppManager {
    async getUserNumber(req: any): Promise<string> {
        return req.body;
    }

    async getUserText(req: any): Promise<string> {
        return req.body;
    }

    async sendTextMessage(textMessage: WaTextMessage): Promise<string | undefined> {
        const response = await this.post(textMessage)
        return response?.messages?.[0]?.id
    }

    async reactToTextMessage(to: string, message_id: string, emoji: string): Promise<void> {
        const body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "reaction",
            reaction: {message_id, emoji}
        }
        await this.post(body)
    }

    async sendMediaMessage(number: string, mediaUrl: string): Promise<void> {
        console.log(`Sending media message to ${number} with media url: ${mediaUrl}`);
    }

    private async post(body: any) {
        const url = `https://graph.facebook.com/${process.env.WA_VERSION}/${process.env.WA_NUMBER_ID}/messages`
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`
        }
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
        return await response.json()
    }
}

export const whatsappManager: IWhatsAppManager = new WhatsAppManager();
