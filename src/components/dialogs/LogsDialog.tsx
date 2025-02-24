import {Procedure} from "@/model/Procedure";
import {useEffect, useState} from "react";
import {Log, LogType} from "@/model/Log";
import * as Tremor from "@tremor/react";
import {Flex, Icon, ListItem, Text} from "@tremor/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {getLogTypeColor, getLogTypeIcon} from "@/utils/ui";
import Link from "next/link";
import {RiCursorLine} from "@remixicon/react";
import {User} from "@/model/User";
import {remult} from "remult";

export type LogView = {
    createdAt: Date,
    user: User | string,
    log: string,
    type: LogType,
    procedure: string | Procedure,
}

const procedureRepo = remult.repo(Procedure);
const userRepo = remult.repo(User);
const logRepo = remult.repo(Log);


export function LogsDialog({procedure, open, onClose}: {
    procedure?: Procedure,
    open: boolean,
    onClose: (val: boolean) => void
}) {
    const [logs, setLogs] = useState<LogView[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
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
            if (!procedure) {
                const logs = await logRepo.find({orderBy: {createdAt: "desc"}, limit: 50})
                setLogs(await Promise.all(logs.map(buildLog)))
            } else {
                const logs = await logRepo.find({
                    where: {procedureId: procedure.id},
                    orderBy: {createdAt: "desc"},
                    limit: 50
                })
                setLogs(await Promise.all(logs.map(buildLog)))
            }
            setLoading(false)
        })()
    }, [procedure]);

    console.log(logs)

    return <Tremor.Dialog open={open} onClose={() => onClose(false)}>
        <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
            <CloseDialogButton close={() => onClose(false)}/>
            <Tremor.Text className={"text-lg font-bold"}>היסטורית שינויים</Tremor.Text>
            <Tremor.List>
                {loading && <Tremor.ListItem>
                    <Tremor.Text>טוען...</Tremor.Text>
                </Tremor.ListItem>}
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
                            typeof log.procedure === "object" && <Link href={`/?id=${log.procedure.id}`}>
                                <Tremor.Icon
                                    color={'indigo'}
                                    icon={RiCursorLine}
                                    className={"cursor-pointer"}
                                />
                            </Link>
                        }
                    </ListItem>

                })}
            </Tremor.List>
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}
