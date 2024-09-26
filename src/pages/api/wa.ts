import {NextApiRequest, NextApiResponse} from "next";
import {WaWebhook} from "@/model/wa/WaWebhook";
import {whatsappManager} from "@/utils/whatsappManager";
import {buildReaction, Emoji} from "@/model/wa/WaReaction";
import {buildMessage} from "@/model/wa/WaTextMessage";
import {buildWaReadReceipts} from "@/model/wa/WaReadReceipts";
import {withRemult} from "remult";
import {Procedure} from "@/model/Procedure";
import {buildInteractiveList} from "@/model/wa/WaInteractiveList";
import {User, UserRole} from "@/model/User";
import {InteractiveType} from "@/model/wa/WhatsApp";
import {District} from "@/model/District";

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
                if (!message?.id) {
                    return
                }

                console.log('Received message:', message.from, message.id, message.text);

                await whatsappManager.sendReceipts(buildWaReadReceipts(message.id))

                await whatsappManager.reactToTextMessage(buildReaction(
                    message.from,
                    message.id,
                    // random emoji
                    Object.values(Emoji)[Math.floor(Math.random() * Object.values(Emoji).length)]
                ));

                await withRemult(async (remult) => {
                    remult.apiClient.url = `${process.env.BASE_URL}/api`
                    const repo = remult.repo(Procedure)
                    const users = remult.repo(User)

                    const user = await users.findFirst({phone: parseInt(message?.from.slice(3))})
                    if (!user) return;

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
                                type: InteractiveType.LIST,
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
                                                title: max24chars(p.title),
                                                description: p.title.length > 24 ? p.title :
                                                    p.updatedAt.toLocaleDateString(
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
                        switch (message.interactive.type) {
                            case "nfm_reply": {
                                try {
                                    const response = JSON.parse(message.interactive.nfm_reply!.response_json) as {
                                        name: string,
                                        email: string,
                                        phone?: string | undefined,
                                        district?: string | undefined
                                    } | undefined
                                    console.log(response)
                                    if (!response) {
                                        await whatsappManager.sendTextMessage(buildMessage(message.from, "נכשל בקבלת הנתונים", false, message.id))
                                    } else {
                                        const district = !!response.district ? District[response.district as keyof typeof District] : user.district
                                        const newUser = await users.insert({
                                            phone: response.phone ? phoneToDb(response.phone) : undefined,
                                            name: response.name,
                                            email: response.email,
                                            district: district,
                                            roles: UserRole.Dispatcher
                                        })
                                        if (newUser) {
                                            await whatsappManager.sendTextMessage(buildMessage(message.from, `המשתמש ${newUser.name} נוצר בהצלחה`, false, message.id))
                                        } else {
                                            await whatsappManager.sendTextMessage(buildMessage(message.from, "נכשל ביצירת המשתמש", false, message.id))
                                        }
                                    }
                                    console.log(response)
                                } catch (e) {
                                    console.error('Error parsing JSON:', e)
                                }
                            }
                                break

                            case "list_reply": {
                                const id = message?.interactive?.list_reply?.id;
                                if (id) {
                                    const p = await repo.findFirst({id})
                                    console.log(p)
                                    await whatsappManager.sendTextMessage(buildMessage(
                                        message.from,
                                        p ? formatProcedure(p) : 'לא נמצאו תוצאות',
                                        true,
                                        message.id
                                    ));
                                }
                            }
                                break
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


function max24chars(str: string): string {
    return str.length > 24 ? str.slice(0, 21) + '...' : str;
}

function formatProcedure(p: Procedure): string {
    return `*מוקד ארצי - ${p.title}*:\n\n${p.procedure}\n\n${process.env.BASE_URL}/?id=${p.id}`
}

function phoneToDb(phone: string): number {
    return parseInt(phone.slice(1))
}
