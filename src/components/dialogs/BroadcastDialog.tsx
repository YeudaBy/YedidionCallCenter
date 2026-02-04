import {User} from "@/model/User";
import {remult, repo} from "remult";
import * as Tremor from "@tremor/react";
import {Text} from "@tremor/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {useEffect, useState} from "react";
import {Loading} from "@/components/Spinner";

export function BroadcastDialog({onClose}: { onClose: () => void }) {

    useEffect(() => {
        if (!User.isSuperAdmin(remult)) {
            onClose();
        }
    }, []);

    const [allTokens, setAllTokens] = useState<string[]>([])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        repo(User).find({
            where: {
                fcmToken: {$nin: [undefined, ""]},
            }
        }).then(users => {
            setAllTokens(users.map(u => u.fcmToken!))
        }).catch(error => {
            console.error("Error fetching FCM tokens:", error);
            setError("אירעה שגיאה בטעינת הטוקנים");
        }).finally(() => {
            setLoading(false);
        })
    }, []);

    console.log(allTokens);

    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [url, setUrl] = useState("/")

    const sendBroadcast = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipients: allTokens,
                    title,
                    body,
                    url,
                }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            onClose();
        } catch (error: any) {
            console.error('Error sending broadcast:', error);
            setError('אירעה שגיאה בשליחת ההודעה: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return <Tremor.Dialog open={true} onClose={onClose}>
        <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
            <CloseDialogButton close={onClose}/>

            {loading ? <Loading/> : <>

                <Tremor.Title>
                    שידור הודעה
                </Tremor.Title>
                <Text className={"text-right"}>
                    כמות משתמשים רשומים לקבלת הודעות: {allTokens.length}
                </Text>

                <Tremor.TextInput
                    className={"w-full"}
                    placeholder={"כותרת ההודעה"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}

                />

                <Tremor.TextInput
                    className={"w-full"}
                    placeholder={"תוכן ההודעה"}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                />

                <Tremor.TextInput
                    className={"w-full"}
                    placeholder={"קישור לפתיחה בלחיצה על ההודעה"}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <Text className={"text-sm text-gray-500 mb-8"}>
                   למעבר לדף הבית יש להשאיר "/"
                </Text>

                {error && <Text className={"text-red-600"}>{error}</Text>}
                <Tremor.Button
                    variant={"primary"}
                    onClick={sendBroadcast}
                    disabled={loading || allTokens.length === 0 || !title || !body}
                >
                    שלח הודעה
                </Tremor.Button>

            </>}
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}
