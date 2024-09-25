// https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages

export type WaTextMessage = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text: {
        preview_url: boolean;
        body: string;
    };
    context?: {
        message_id: string;
    };
}

export function buildMessage(to: string, text: string, previewLinks: boolean, replay?: string): WaTextMessage {
    const message: WaTextMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
            preview_url: previewLinks,
            body: text
        }
    }
    if (replay) {
        message.context = {
            message_id: replay
        }
    }
    return message;
}

export type WaTextMessageResponse = {
    messaging_product: string;
    contacts: {
        input: string;
        wa_id: string;
    }[];
    messages: {
        id: string;
    }[];
}
