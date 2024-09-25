// https://developers.facebook.com/docs/whatsapp/cloud-api/messages/image-messages

export type WaImageMessage = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    image: {
        link: string;
        caption?: string;
    }
}

export function buildWaImageMessage(to: string, link: string, caption: string | undefined): WaImageMessage {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
            link,
            caption
        }
    }
}
