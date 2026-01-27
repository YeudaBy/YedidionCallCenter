import {User, UserRole} from "@/model/User";
import {remult, repo} from "remult";
import * as Tremor from "@tremor/react";
import {RiAddLine, RiEyeLine, RiEyeOffLine, RiFileDownloadLine, RiFileList3Fill, RiGroupLine} from "@remixicon/react";
import {ReactNode, useEffect, useState} from "react";
import { useRouter } from "next/router";
import {exportToXLSX} from "@/utils/xlsx";
import {Header, Headers} from "@/components/Header";
import {District} from "@/model/District";

const userRepo = repo(User)

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

    const headerButtons: Array<ReactNode> = [];
    if (User.isAdmin(remult)) {
        headerButtons.push(<Tremor.Icon
            variant={"outlined"}
            className={"cursor-pointer"}
            icon={RiAddLine} onClick={openCreateModal}/>,
        )
        headerButtons.push(
            <Tremor.Icon
                variant={"shadow"}
                onClick={() => router.push('/admin')}
                icon={RiGroupLine}
                data-badge={waitingCount == 0 ? undefined : waitingCount}
                className={"cursor-pointer"}
            />
        )
        headerButtons.push(
            <Tremor.Icon
                variant={"shadow"}
                className={"cursor-pointer"}
                icon={showInactive ? RiEyeLine : RiEyeOffLine}
                onClick={() => setShowInactive(!showInactive)}/>
        )
        headerButtons.push(
            // eslint-disable-next-line react/jsx-no-undef
            <Tremor.Icon icon={RiFileDownloadLine}
                  onClick={exportProceduresToXLSX}
                  variant={'shadow'}
                  className={"cursor-pointer"}/>
        )
    }
    if (User.isSuperAdmin(remult)) {
        headerButtons.push(
            <Tremor.Icon
                variant={"shadow"}
                className={"cursor-pointer"}
                icon={RiFileList3Fill}
                onClick={() => setLogsOpen(true)}/>
        )
    }

    return  <Header headerText={Headers.INDEX} buttons={headerButtons} />
}
