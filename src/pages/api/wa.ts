import {NextApiRequest, NextApiResponse} from "next";
import {WaMessage, WaWebhook} from "@/model/wa/WaWebhook";
import {whatsappManager} from "@/utils/whatsappManager";
import {buildReaction, Emoji} from "@/model/wa/WaReaction";
import {buildMessage} from "@/model/wa/WaTextMessage";
import {buildWaReadReceipts} from "@/model/wa/WaReadReceipts";
import {Remult, withRemult} from "remult";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {buildFlow, buildInteractiveList} from "@/model/wa/WaInteractiveList";
import {User} from "@/model/User";
import {InteractiveType} from "@/model/wa/WhatsApp";
import {District} from "@/model/District";
import {buildWaImageMessage} from "@/model/wa/WaImageMessage";
import {UserRole} from "@/model/SuperAdmin";

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
                    Emoji.Like
                ));

                await withRemult(async (remult) => {
                    remult.apiClient.url = `${process.env.BASE_URL}/api`

                    const currentUser = await remult.repo(User).findFirst({phone: parseInt(message?.from.slice(3))})
                    if (!currentUser) return;

                    if (message.text?.body === "חדש") {
                        await handleAddNewRequest(remult, currentUser, message)
                        return
                    }

                    if (message?.text) {
                        await handleSearch(remult, message)
                    } else if (message?.interactive) {
                        switch (message.interactive.type) {
                            case "nfm_reply":
                                await handleNewUserAdded(remult, message, currentUser);
                                break

                            case "list_reply":
                                await viewProcedure(remult, message)
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
            res.status(400).end() // Method Not Allowed
            break
    }
}

async function viewProcedure(remult: Remult, message: WaMessage) {
    const id = message?.interactive?.list_reply?.id;
    const procRepo = remult.repo(Procedure)

    if (id) {
        const p = await procRepo.findFirst({id})
        console.log(p)
        await whatsappManager.sendTextMessage(buildMessage(
            message.from,
            p ? formatProcedure(p) : 'לא נמצאו תוצאות',
            true,
            message.id
        ));
        if (p?.images) {
            for (const image of p.images) {
                await whatsappManager.sendMediaMessage(buildWaImageMessage(
                    message.from,
                    image,
                    p.title
                ))
            }
        }
    }
}

async function handleNewUserAdded(remult: Remult, message: WaMessage, currentUser: User) {
    const users = remult.repo(User)
    try {
        const response = JSON.parse(message.interactive!.nfm_reply!.response_json) as {
            name: string,
            email: string,
            phone?: string | undefined,
            district?: string | undefined
        } | undefined
        console.log(response)
        if (!response) {
            await whatsappManager.sendTextMessage(buildMessage(message.from, "נכשל בקבלת הנתונים", false, message.id))
        } else {
            const district = response.district ? District[response.district as keyof typeof District] : currentUser.district
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

async function handleSearch(remult: Remult, message: WaMessage) {
    const repo = remult.repo(Procedure)
    const searchTerm = message.text!.body.trim()

    const results = await repo.find({
        limit: 10,
        where: {
            $or: [
                {title: searchTerm},
                {
                    keywords: {
                        $contains: searchTerm
                    }
                }
            ]
        },
        orderBy: {
            updatedAt: 'desc'
        }
    })
    if (!results.length) {
        const extraResults = await repo.find({
            limit: 10,
            where: {
                procedure: {
                    $contains: searchTerm
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })
        if (!extraResults.length) {
            results.push(...extraResults)
        } else
            await whatsappManager.sendTextMessage(buildMessage(
                message.from,
                'לא נמצאו תוצאות העונות על החיפוש המבוקש :(\n\nנסו להכנס לאתר לחיפוש מתקדם יותר\n\n' + process.env.BASE_URL,
                true,
                message?.id
            ));
        return;
    }
    await whatsappManager.sendInteractiveMessage(buildInteractiveList(
        message.from,
        {
            type: InteractiveType.LIST,
            body: {
                text: `להלן תוצאות החיפוש עבור *${searchTerm}*, בחרו את הנוהל הרלוונטי ביותר לצפייה:`
            },
            footer: {
                text: `${results.length} תוצאות נמצאו.`
            },
            action: {
                button: "בחר נוהל",
                sections: [
                    {
                        title: 'כותרת',
                        rows: results.map(p => ({
                            id: p.id,
                            title: max24chars(p.title),
                            description: p.title.length > 24 ? p.title :
                                max24chars(p.procedure.replace(/\n/g, ' ')),
                        }))
                    }
                ]
            }
        }
    ))
}

async function handleAddNewRequest(remult: Remult, currentUser: User, message: WaMessage) {

    console.log({currentUser, roles: currentUser.roles})

    console.log(currentUser.roles == UserRole.SuperAdmin)
    const isAdmin = currentUser.isRegularAdmin
    const isSuperAdmin = currentUser.isSuperAdmin

    if (!isSuperAdmin || !isAdmin) {
        console.log(`User ${currentUser.name} (${currentUser.id}) attempted to add a new user without sufficient permissions.`);
        return
    }

    const flowId = (isSuperAdmin ? process.env.WA_ADD_USER__SUPER_ADMIN_FLOW_ID : process.env.WA_ADD_USER__ADMIN_FLOW_ID) as string
    const flowName = isSuperAdmin ? "add_user__super_admin" : "add_user__admin"
    const screen = isSuperAdmin ? "ADD_NEW_SUPER_ADMIN" : "ADD_NEW"
    await whatsappManager.sendInteractiveMessage(buildFlow(
        message.from,
        'תהליך הוספת מוקדן חדש',
        `בלחיצה על הכפתור המצורף, תוכלו להוסיף מוקדנים חדשים למערכת הנהלים, לצורך שימוש באתר ובבוט.\n\nעריכת, מחיקת ואישור מוקדנים מתבצעת על ידי דף ניהול המשתמשים באתר\n\n${process.env.BASE_URL}/admin`,
        "footer",
        flowId,
        flowName,
        screen
    ))
    return
}


function max24chars(str: string): string {
    return str.length > 24 ? str.slice(0, 21) + '...' : str;
}

function formatProcedure(p: Procedure): string {
    if (p.type === ProcedureType.Guideline) return p.procedure
    return `*מוקד ארצי - ${p.title}*:\n\n${p.procedure}\n\n${process.env.BASE_URL}/?id=${p.id}`
}

function phoneToDb(phone: string): number {
    return parseInt(phone.slice(1))
}
