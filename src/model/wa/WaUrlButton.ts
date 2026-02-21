// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-cta-url-messages


export type WaUrlButtonMessage = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: "interactive";
    interactive: {
        type: "cta_url";
        body: {
            text: string;
        };
        action: {
            name: "cta_url";
            parameters: {
                display_text: string;
                url: string;
            }
        };
    };
}


export function buildUrlButtonMessage(to: string, text: string, displayText: string, url: string): WaUrlButtonMessage {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "cta_url",
            body: {
                text
            },
            action: {
                name: "cta_url",
                parameters: {
                    display_text: displayText,
                    url
                }
            }
        }
    };
}
