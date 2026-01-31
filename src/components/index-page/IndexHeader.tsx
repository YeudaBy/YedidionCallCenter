import {User, UserRole} from "@/model/User";
import {remult, repo} from "remult";
import * as Tremor from "@tremor/react";
import {
    RiAddLine,
    RiEyeLine,
    RiEyeOffLine,
    RiFileDownloadLine,
    RiFileList3Fill,
    RiFileUploadLine,
    RiGroupLine
} from "@remixicon/react";
import {ReactNode, useEffect, useState} from "react";
import { useRouter } from "next/router";
import {Header, Headers} from "@/components/Header";
import {District} from "@/model/District";
import {importFromXLSX, importProceduresFromXLSX} from "@/utils/xlsx";
import {Procedure} from "@/model/Procedure";
import {Log, LogType} from "@/model/Log";

const userRepo = repo(User)
const logRepo = repo(Log)

export function IndexHeader({
    openCreateModal, showInactive, setShowInactive, setLogsOpen, exportProceduresToXLSX
                            }: {
    openCreateModal: () => void,
    showInactive: boolean,
    setShowInactive: (show: boolean) => void,
    setLogsOpen: (open: boolean) => void,
    exportProceduresToXLSX: () => void,
}) {
    const router = useRouter();
    const [waitingCount, setWaitingCount] = useState(0)

    useEffect(() => {
        userRepo.count({
            roles: {$contains: UserRole.Dispatcher},
            district: {"$nin": Object.values(District)}
        }).then(count => {
            setWaitingCount(count)
        })
    }, []);

    const onImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                importProceduresFromXLSX(file).then((results: Procedure[]) =>{
                    repo(Procedure).insert(results).then(() => {
                        alert(`נוספו ${results.length} נהלים בהצלחה`);
                        return results
                    }).then(results => {
                        results.map(async (procedure) => {
                            const log = logRepo.create();
                            log.type = LogType.Imported;
                            log.procedureId = procedure.id!;
                            log.log = `נוסף נוהל "${procedure.title}" באמצעות ייבוא קובץ XLSX`;
                            log.byUserId = remult.user!.id;
                            await logRepo.insert(log);
                        })
                    }).catch(error => {
                        alert("אירעה שגיאה בעת הוספת הנהלים: " + error.message);
                    })
                }).catch((error: any) => {
                    alert("אירעה שגיאה בעת קריאת הקובץ: " + error.message);
                })
            }
        };
        input.click();
    }

    const headerButtons: Array<ReactNode> = [];
    if (User.isSuperAdmin(remult)) {
        headerButtons.push(
            <Tremor.Icon
                variant={"outlined"}
                className={"cursor-pointer"}
                icon={RiAddLine} onClick={openCreateModal}/>,
            <Tremor.Icon
                variant={"shadow"}
                className={"cursor-pointer"}
                icon={RiFileList3Fill}
                onClick={() => setLogsOpen(true)}/>,
            <Tremor.Icon
                variant={"shadow"}
                className={"cursor-pointer"}
                icon={RiFileUploadLine}
                onClick={onImportClick}/>,
            <Tremor.Icon icon={RiFileDownloadLine}
                         onClick={exportProceduresToXLSX}
                         variant={'shadow'}
                         className={"cursor-pointer"}/>
        )
    }
    if (User.isAdmin(remult)) {
        headerButtons.push(
            <Tremor.Icon
                variant={"shadow"}
                onClick={() => router.push('/admin')}
                icon={RiGroupLine}
                data-badge={waitingCount == 0 ? undefined : waitingCount}
                className={"cursor-pointer"}
            />,
            <Tremor.Icon
                variant={"shadow"}
                className={"cursor-pointer"}
                icon={showInactive ? RiEyeLine : RiEyeOffLine}
                onClick={() => setShowInactive(!showInactive)}/>
        )
    }

    return  <Header headerText={Headers.INDEX} buttons={headerButtons} />
}
