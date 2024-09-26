import {NextApiRequest, NextApiResponse} from "next";
import {whatsappManager} from "@/utils/whatsappManager";
import {buildFlow} from "@/model/wa/WaInteractiveList";

// const procedureRepo = remult.repo(Procedure)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const sa = req.query.sa

    const r = await whatsappManager.sendInteractiveMessage(buildFlow(
        "972537845671",
        'תהליך הוספת מוקדן חדש',
        `בלחיצה על הכפתור המצורף, תוכלו להוסיף מוקדנים חדשים למערכת הנהלים, לצורך שימוש באתר ובבוט.\n\nעריכת, מחיקת ואישור מוקדנים מתבצעת על ידי דף ניהול המשתמשים באתר\n\n${process.env.BASE_URL}/admin`,
        "בדיקה",
        (!!sa ? process.env.WA_ADD_USER__SUPER_ADMIN_FLOW_ID : process.env.WA_ADD_USER__ADMIN_FLOW_ID) as string,
        sa ? "add_user__super_admin" : "add_user__admin",
        sa ? "ADD_NEW_SUPER_ADMIN" : "ADD_NEW"
    ))

    console.log(r)

    // await withRemult(async (remult) => {
    //     remult.apiClient.url = 'http://localhost:3000/api'
    //     const repo = remult.repo(Procedure)
    //     const p = await repo.find({limit: 2})
    //     console.log(p)
    // })
    // const p = await procedureRepo.find({limit: 2})

    res.status(200).json({name: 'John Doe'})
}
