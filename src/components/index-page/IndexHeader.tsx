import {User, UserRole} from "@/model/User";
import {remult, repo} from "remult";
import * as Tremor from "@tremor/react";
import {
    RiAddLine,
    RiEyeLine,
    RiEyeOffLine,
    RiGroupLine
} from "@remixicon/react";
import {ReactNode, useEffect, useState} from "react";
import { useRouter } from "next/router";
import {Header, Headers} from "@/components/Header";
import {District} from "@/model/District";
const userRepo = repo(User)

export function IndexHeader({
    openCreateModal, showInactive, setShowInactive
                            }: {
    openCreateModal: () => void,
    showInactive: boolean,
    setShowInactive: (show: boolean) => void,
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
    if (User.isSuperAdmin(remult)) {
        headerButtons.push(
            <Tremor.Icon
                variant={"outlined"}
                className={"cursor-pointer"}
                icon={RiAddLine} onClick={openCreateModal}/>,
        )
    }
    if (User.isSomeAdmin(remult)) {
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
