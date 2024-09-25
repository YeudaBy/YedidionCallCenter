import {NextApiRequest, NextApiResponse} from "next";
import {WaWebhook} from "@/model/wa/WaWebhook";
import {whatsappManager} from "@/utils/whatsappManager";
import {buildReaction, Emoji} from "@/model/wa/WaReaction";
import {buildMessage} from "@/model/wa/WaTextMessage";
import {buildWaReadReceipts} from "@/model/wa/WaReadReceipts";
import {withRemult} from "remult";
import {Procedure} from "@/model/Procedure";
import {buildInteractiveList} from "@/model/wa/WaInteractiveList";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST': {
            const update = req.body as WaWebhook;
            try {
                const messageValue = update.entry[0].changes?.[0].value;

                if (messageValue?.metadata?.display_phone_number !== process.env.WA_DISPLAY_PHONE_NUMBER) {
                    res.status(200).json({success: false});
                    return;
                }

                const message = messageValue?.messages?.[0];
                if (!!message) {
                    console.log('Received message:', message.from, message.id, message.text);
                }

                await whatsappManager.sendReceipts(buildWaReadReceipts(message.id))

                await whatsappManager.reactToTextMessage(buildReaction(
                    message.from,
                    message.id,
                    Emoji.Like
                ));

                await withRemult(async (remult) => {
                    remult.apiClient.url = `${process.env.BASE_URL}/api`
                    const repo = remult.repo(Procedure)
                    if (message?.text) {
                        const results = await repo.find({
                            limit: 10,
                            where: {
                                $or: [
                                    {title: message.text.body},
                                    {
                                        keywords: {
                                            $contains: message.text.body
                                        }
                                    }
                                ]
                            },
                            orderBy: {
                                updatedAt: 'desc'
                            }
                        })
                        console.log(results)
                        if (!results.length) {
                            await whatsappManager.sendTextMessage(buildMessage(
                                message.from,
                                'לא נמצאו תוצאות',
                                true,
                                message?.id
                            ));
                            return;
                        }
                        await whatsappManager.sendInteractiveMessage(buildInteractiveList(
                            message.from,
                            {
                                type: 'list',
                                header: {
                                    type: 'text',
                                    text: 'תוצאות חיפוש:'
                                },
                                body: {
                                    text: 'להלן תוצאות החיפוש למונח המבוקש'
                                },
                                footer: {
                                    text: 'מוקד ידידים 1230'
                                },
                                action: {
                                    button: "בחר נוהל",
                                    sections: [
                                        {
                                            title: 'כותרת',
                                            rows: results.map(p => ({
                                                title: p.title,
                                                description: p.updatedAt.toLocaleDateString(
                                                    'he-IL',
                                                    {
                                                        year: 'numeric',
                                                        month: 'numeric',
                                                        day: 'numeric',
                                                    }
                                                ),
                                                id: p.id
                                            }))
                                        }
                                    ]
                                }
                            }
                        ))
                    } else if (message?.interactive) {
                        console.log(JSON.stringify(message.interactive))
                        const id = message?.interactive?.type?.list_reply?.id;
                        if (id) {
                            const p = await repo.findFirst({id})
                            console.log(p)
                            await whatsappManager.sendTextMessage(buildMessage(
                                message.from,
                                p?.parseToWaString() || 'Not found',
                                true,
                                message.id
                            ));
                        }
                    }
                })

                res.status(200).json({success: true});
            } catch (e) {
                console.error('Error processing webhook:', e);
                res.status(200).json({success: false});
            }
        }
            break
        case 'GET': {
            const verify_token = process.env.WA_VERIFY_TOKEN;
            const {'hub.verify_token': token, 'hub.challenge': challenge} = req.query;
            if (token === verify_token) {
                res.status(200).send(challenge);
            } else {
                res.status(403).send('Verification failed');
            }
        }
            break
        default:
            res.status(405).end() // Method Not Allowed
            break
    }
}
