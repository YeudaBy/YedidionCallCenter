// https://developers.facebook.com/docs/whatsapp/cloud-api/messages/reaction-messages

export type WaReaction = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    reaction: {
        message_id: string;
        emoji: string;
    };
}

export function buildReaction(to: string, message_id: string, emoji: string): WaReaction {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "reaction",
        reaction: {message_id, emoji}
    }
}

export enum Emoji {
    // \uD83D\uDE00 = 😀
    SMILE = "\uD83D\uDE00",
    // \uD83D\uDE02 = 😂
    LAUGH = "\uD83D\uDE02",
    // \uD83D\uDE0A = 😊
    BLUSH = "\uD83D\uDE0A",
    // \uD83D\uDE0D = 😍
    HEART_EYES = "\uD83D\uDE0D",
    // \uD83D\uDE12 = 😒
    UNAMUSED = "\uD83D\uDE12",
    // \uD83D\uDE14 = 😔
    PENSIVE = "\uD83D\uDE14",
    Like = "\uD83D\uDC4D",
    Dislike = "\uD83D\uDC4E",
    Vi = "\uD83D\uDC4F",
    Ok = "\uD83D\uDC4C",
    Love = "\uD83D\uDC96",
    Heart = "\u2764",
    Clap = "\uD83D\uDC4F",
}
