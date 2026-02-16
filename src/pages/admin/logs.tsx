import {RoleGuard} from "@/components/auth/RoleGuard";
import {User} from "@/model/User";
import {remult, repo} from "remult";
import {Log, LogType} from "@/model/Log";
import {useEffect, useState} from "react";
import {Header, Headers} from "@/components/Header";
import {Procedure} from "@/model/Procedure";
import * as Tremor from "@tremor/react";
import {Flex, Icon, ListItem, Text} from "@tremor/react";
import {getLogTypeColor, getLogTypeIcon} from "@/utils/ui";
import Link from "next/link";
import {RiCursorHand} from "@remixicon/react";
import {useRouter} from "next/router";
import {Loading} from "@/components/Spinner";
import {UserRole} from "@/model/SuperAdmin";

export type LogView = {
    createdAt: Date,
    user: User | string,
    log: string,
    type: LogType,
    procedure: string | Procedure,
}


const logRepo = repo(Log)
const userRepo = repo(User)
const procedureRepo = repo(Procedure)

export default function LogsPage() {
    const [logs, setLogs] = useState<LogView[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [procedureId, setProcedureId] = useState<string | undefined>()
    const [userId, setUserId] = useState<string | undefined>()

    const router = useRouter()

    useEffect(() => {
        if (!User.isSuperAdmin(remult)) {
            return
        }

        if (!router.query.pid) {
            setProcedureId(String(router.query.pid))
        }

        if (!router.query.uid) {
            setUserId(String(router.query.uid))
        }

        async function buildLog(log: Log): Promise<LogView> {
            const user = await userRepo.findFirst({id: log.byUserId})
            const procedure = await procedureRepo.findFirst({id: log.procedureId})
            return {
                createdAt: log.createdAt,
                user: user?.name || log.byUserId,
                procedure: procedure || log.procedureId,
                log: log.log,
                type: log.type
            }
        }

        (async () => {
            setLoading(true)
            try {
                if (!userId && !procedureId) {
                    const logs = await logRepo.find({orderBy: {createdAt: "desc"}, limit: 50})
                    setLogs(await Promise.all(logs.map(buildLog)))
                } else if (procedureId) {
                    const logs = await logRepo.find({
                        where: {procedureId},
                        orderBy: {createdAt: "desc"},
                        limit: 50
                    })
                    setLogs(await Promise.all(logs.map(buildLog)))
                } else if (userId) {
                    const logs = await logRepo.find({
                        where: {byUserId: userId},
                        orderBy: {createdAt: "desc"},
                        limit: 50
                    })
                    setLogs(await Promise.all(logs.map(buildLog)))
                }
            } catch (e: unknown) {
                setError("אירעה שגיאה בטעינת היומנים")
                console.error(e)
            } finally {
                setLoading(false)
            }
        })()
    }, [procedureId, userId, router.query]);

    return (
        <RoleGuard allowedRoles={[UserRole.SuperAdmin]}>
            <Header headerText={Headers.LOGS} buttons={[]} />
            <Tremor.List>
                {loading && <Loading/>}
                {logs.length === 0 && !loading && <Tremor.ListItem>
                    <Tremor.Text>לא נמצאו שינויים</Tremor.Text>
                </Tremor.ListItem>}
                {logs.map((log, i) => {
                    return <ListItem key={i} className={"text-start text-xs flex-row flex justify-start items-start"}>
                        <Icon
                            icon={getLogTypeIcon(log.type)}
                            color={getLogTypeColor(log.type)}
                        />
                        <Flex className={""} flexDirection={"col"} justifyContent={"start"} alignItems={"start"}>
                            <Text className={"text-xs opacity-75"}>
                                {log.createdAt.toLocaleString("he-IL")}
                                <span
                                    className={"font-semibold"}> | ע״י {typeof log.user === "string" ? log.user : log.user.name}</span>
                            </Text>
                            <span className={"font-mono"} dangerouslySetInnerHTML={{__html: log.log}}/>
                        </Flex>
                        {
                            (log.procedure instanceof Procedure) && <Link href={`/?id=${log.procedure.id}`}>
                                <Tremor.Icon
                                    color={'indigo'}
                                    icon={RiCursorHand}
                                    className={"cursor-pointer"}
                                />
                            </Link>
                        }
                    </ListItem>

                })}
            </Tremor.List>
        </RoleGuard>
    );
}
