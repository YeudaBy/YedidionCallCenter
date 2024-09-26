import {InteractiveType} from "@/model/wa/WhatsApp";

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
    type: InteractiveType;
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

// {
//   "recipient_type": "individual",
//   "messaging_product": "whatsapp",
//   "to": "PHONE_NUMBER",
//   "type": "interactive",
//   "interactive": {
//     "type": "flow",
//     "header": {
//       "type": "text",
//       "text": "Flow message header"
//     },
//     "body": {
//       "text": "Flow message body"
//     },
//     "footer": {
//       "text": "Flow message footer"
//     },
//     "action": {
//       "name": "flow",
//       "parameters": {
//         "flow_message_version": "3",
//         "flow_token": "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
//         "flow_id": "1",
//         "flow_cta": "Book!",
//         "flow_action": "navigate",
//         "flow_action_payload": {
//           "screen": "<SCREEN_NAME>",
//           "data": {
//             "product_name": "name",
//             "product_description": "description",
//             "product_price": 100
//           }
//         }
//       }
//     }
//   }
// }

export type WaFlow = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    interactive: {
        type: string;
        header: {
            type: string;
            text: string;
        };
        body: { text: string; };
        footer: { text: string; };
        action: {
            name: string;
            parameters: {
                flow_message_version: string;
                flow_token: string;
                flow_id: string;
                flow_cta: string;
                flow_action: string;
                flow_action_payload: {
                    screen: string;
                    data: {
                        product_name: string;
                        product_description: string;
                        product_price: number;
                    }
                }
            }
        }
    }
}

export function buildFlow(
    to: string,
    header: string,
    body: string,
    footer: string,
    flowId: string
): WaFlow {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "flow",
            header: {
                type: "text",
                text: header
            },
            body: {
                text: body
            },
            footer: {
                text: footer
            },
            action: {
                name: "flow",
                parameters: {
                    flow_message_version: "3",
                    flow_token: "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
                    flow_id: "1717241419022350",
                    flow_cta: "הוספת מוקדן",
                    flow_action: "navigate",
                    flow_action_payload: {
                        screen: "ADD_NEW",
                        data: {
                            product_name: "name",
                            product_description: "description",
                            product_price: 100
                        }
                    }
                }
            }
        }
    }
}
