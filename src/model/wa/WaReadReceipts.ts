export type WaReadReceipts = {
    messaging_product: string;
    status: string;
    message_id: string;
}

export function buildWaReadReceipts(message_id: string): WaReadReceipts {
    return {
        messaging_product: "whatsapp",
        status: "read",
        message_id
    }
}
