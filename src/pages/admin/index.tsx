import React, {useEffect, useState} from "react";
import {Card, Flex, Grid, Icon, Text} from "@tremor/react";
import {Header, Headers} from "@/components/Header";
import {
    RiAB,
    RiFolderDownloadLine,
    RiFolderUploadLine,
    RiSendInsLine,
    RiTimelineView,
    RiUserSettingsLine
} from "@remixicon/react";
import Link from "next/link";
import {User, UserRole} from "@/model/User";
import {remult, repo} from "remult";
import {Procedure} from "@/model/Procedure";
import {exportProceduresToXLSX, importProceduresFromXLSX} from "@/utils/xlsx";
import {Log, LogType} from "@/model/Log";
import {BroadcastDialog} from "@/components/dialogs/BroadcastDialog";
import {RoleGuard} from "@/components/auth/RoleGuard";

const procedureRepo = repo(Procedure);
const logRepo = repo(Log);

export default function AdminPage() {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    useEffect(() => {
        if (User.isSuperAdmin(remult)) {
            setIsSuperAdmin(true);
        }
    }, []);
    const [broadcastOpen, setBroadcastOpen] = useState(false)

    const exportProcedures = () => {
        try {
            procedureRepo.find().then(procedures => {
                exportProceduresToXLSX(procedures);
            })
        } catch (error: unknown) {
            alert("אירעה שגיאה בעת ייצוא הנהלים: " + (error as Error).message);
        }
    }

    const importProcedures = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                importProceduresFromXLSX(file).then((results: Procedure[]) => {
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

    const broadcastNotification = () => {
        setBroadcastOpen(true);
    }

    const options: {
        action: string | (() => void),
        label: string,
        icon: React.ElementType
    }[] = [
        {
            action: "/admin/users",
            label: "ניהול משתמשים",
            icon: RiUserSettingsLine
        },
        {
            action: "/admin/beta/users",
            label: "ניהול משתמשים (בטא)",
            icon: RiAB
        },
        {
            action: "/admin/beta/procedures",
            label: "ניהול נהלים )בטא(",
            icon: RiTimelineView
        }
    ];

    if (isSuperAdmin) {
        options.push(
            {
                action: "/admin/logs",
                label: "צפייה בלוג מערכת",
                icon: RiTimelineView
            },
            {
                action: exportProcedures,
                label: "ייצוא נהלים",
                icon: RiFolderDownloadLine
            },
            {
                action: importProcedures,
                label: "ייבוא נהלים",
                icon: RiFolderUploadLine
            },
            {
                action: broadcastNotification,
                label: "שידור הודעה",
                icon: RiSendInsLine
            }
        );
    }

    return <RoleGuard allowedRoles={[UserRole.Admin, UserRole.SuperAdmin]}>
        <Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
            <Header headerText={Headers.ADMIN} buttons={[]}/>
            <Grid numItems={2} numItemsMd={4} className={"gap-4 m-4"}>
                {options.map((option, index) => (
                    <NavigationCard
                        key={index}
                        label={option.label}
                        icon={option.icon}
                        action={option.action}
                    />
                ))}
            </Grid>

            {broadcastOpen && <BroadcastDialog onClose={() => setBroadcastOpen(false)}/>}
        </Flex>
    </RoleGuard>

}

function NavigationCard({label, icon, action}: {
    label: string,
    icon: React.ElementType,
    action: (() => void) | string
}) {
    const Content = () => <Card
        className={"p-6 hover:shadow-lg transition-shadow cursor-pointer"}
        onClick={typeof action === "string" ? undefined : action}
    >
        <Flex className={"gap-2 flex-col justify-center items-center"}>
            <Icon icon={icon} size={"xl"}/>
            <Text className={"text-sm font-semibold"}>{label}</Text>
        </Flex>
    </Card>

    if (typeof action == "string") {
        return <Link href={action}>
            <Content/>
        </Link>
    }
    return <Content/>

}
