export type InteractiveListSection = {
    title: string;
    rows: InteractiveListRow[];
};

export type InteractiveListRow = {
    id: string;
    title: string;
    description?: string;
};

export type InteractiveListAction = {
    sections: InteractiveListSection[];
    button: string;
};

/**
 * Interactive list message
 * https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-list-messages
 *
 * * @interface InteractiveList
 */
export type InteractiveList = {
    type: string;
    header?: {
        type: string;
        text: string;
    };
    body: { text: string; };
    footer?: { text: string; };
    action: InteractiveListAction;
};

export type WaInteractiveList = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    interactive: InteractiveList;
};

export function buildInteractiveList(to: string, interactive: InteractiveList): WaInteractiveList {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive
    }
}

export type WaInteractiveListResponse = {
    messaging_product: string;
    contacts: {
        input: string;
        wa_id: string;
    }[];
    messages: {
        id: string;
    }[];
}

export type WaInteractiveListWebhook = {
    object: string;
    entry: {
        id: string;
        changes: {
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts: {
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }[];
                messages: {
                    context: {
                        from: string;
                        id: string;
                    };
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    interactive: {
                        type: string;
                        list_reply: {
                            id: string;
                            title: string;
                            description: string;
                        };
                    };
                }[];
            };
            field: string;
        }[];
    }[];
}

export function getIdFromInteractiveListWebhook(webhook: WaInteractiveListWebhook): string {
    return webhook.entry[0].changes[0].value.messages[0].interactive.list_reply.id;
}
