// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks

export type WaWebhook = {
    object: string;
    entry: WebhookEntry[];
}

export type WebhookEntry = {
    id: string;
    time: number;
    changes: WebhookChange[];
}

export type WebhookChange = {
    field: string;
    value: WebhookValue;
}

export type WebhookValue = {
    messaging_product: string;
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts: WaContact[];
    errors: WaError[];
    messages: WaMessage[];
    statuses: any[];
}

export type WaContact = {
    wa_id: string;
    user_id: string;
    profile: {
        name: string
    }
}

export type WaError = {
    code: number;
    title: string;
    message: string;
    error_data: {
        details: string;
    }
}

export type WaMessage = {
    from: string;
    id: string;
    interactive?: {
        type: {
            button_reply?: {
                id: string;
                title: string;
            },
            list_reply?: {
                id: string;
                title: string;
                description: string;
            }
        }
    },
    text?: {
        body: string;
    },
    timestamp: string;
    type: "audio" | "button" | "document" | "image" | "interactive" | "text"
}
