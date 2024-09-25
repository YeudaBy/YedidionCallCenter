import {WaTextMessage, WaTextMessageResponse} from "@/model/wa/WaTextMessage";
import {WaReadReceipts} from "@/model/wa/WaReadReceipts";
import {WaReaction} from "@/model/wa/WaReaction";
import {WaImageMessage} from "@/model/wa/WaImageMessage";

export interface IWhatsAppManager {
    getUserNumber(req: any): Promise<string>;

    getUserText(req: any): Promise<string>;

    sendTextMessage(object: WaTextMessage): Promise<string | undefined>;

    reactToTextMessage(object: WaReaction): Promise<void>;

    sendMediaMessage(object: WaImageMessage): Promise<string | undefined>;

    sendReceipts(object: WaReadReceipts): Promise<void>;
}

class WhatsAppManager implements IWhatsAppManager {
    async getUserNumber(req: any): Promise<string> {
        return req.body;
    }

    async getUserText(req: any): Promise<string> {
        return req.body;
    }

    async sendTextMessage(object: WaTextMessage): Promise<string | undefined> {
        const response: WaTextMessageResponse = await this.post(object)
        return response?.messages?.[0]?.id
    }

    async reactToTextMessage(object: WaReaction): Promise<void> {
        await this.post(object);
    }

    async sendMediaMessage(object: WaImageMessage): Promise<string | undefined> {
        const response: WaTextMessageResponse = await this.post(object);
        return response?.messages?.[0]?.id
    }

    async sendReceipts(object: WaReadReceipts): Promise<void> {
        await this.post(object);
    }

    private async post(body: any) {
        const url = `https://graph.facebook.com/${process.env.WA_VERSION}/${process.env.WA_NUMBER_ID}/messages`
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })
            console.log(JSON.stringify(await response.clone().json()))
            return await response.json()
        } catch (e) {
            console.error('Error sending message:', e)
            return undefined
        }
    }
}

export const whatsappManager: IWhatsAppManager = new WhatsAppManager();
