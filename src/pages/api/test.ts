import {NextApiRequest, NextApiResponse} from "next";
import {whatsappManager} from "@/utils/whatsappManager";
import {buildFlow} from "@/model/wa/WaInteractiveList";

// const procedureRepo = remult.repo(Procedure)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const r = await whatsappManager.sendInteractiveMessage(buildFlow(
        "972534506559",
        'תהליך הוספת מוקדן חדש',
        "בלחיצה על הכפתור המצורף, תוכלו להוסיף מוקדנים חדשים למערכת הנהלים, לצורך שימוש באתר ובבוט.\n\nשימו לב, במידה והמוקדן נכנס בעבר לאתר ונרשם לו שהוא ממתין לאישור, נא לאשר דרך האתר ולא לרשום אותו מחדש בתהליך זה.",
        "",
        process.env.WA_ADD_USER__ADMIN_FLOW_ID as string
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
