import React, {useEffect, useState} from "react";
import {Card, Flex, Grid, Icon, Text} from "@tremor/react";
import {Header, Headers} from "@/components/Header";
import {
    RiAB,
    RiFolderDownloadLine,
    RiFolderUploadLine,
    RiMenu4Line,
    RiSendInsLine,
    RiTimelineView,
    RiUserSettingsLine
} from "@remixicon/react";
import Link from "next/link";
import {User} from "@/model/User";
import {remult, repo} from "remult";
import {Procedure} from "@/model/Procedure";
import {exportProceduresToXLSX, importProceduresFromXLSX} from "@/utils/xlsx";
import {Log, LogType} from "@/model/Log";
import {BroadcastDialog} from "@/components/dialogs/BroadcastDialog";
import {RoleGuard} from "@/components/auth/RoleGuard";
import {UserRole} from "@/model/SuperAdmin";
import {toast} from "sonner";

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
        } catch (error) {
            console.error("Error exporting procedures:", error);
            toast.error("אירעה שגיאה בעת ייצוא הנהלים");
        }
    }

    const importProcedures = () => {  // TODO review imported procedures
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    importProceduresFromXLSX(file).then((results: Procedure[]) => {
                        repo(Procedure).insert(results).then(() => {
                            toast.success(`הנהלים הובאו בהצלחה! ${results.length} נהלים נוספו.`);
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
                            console.error("Error inserting imported procedures:", error);
                            toast.error("אירעה שגיאה בעת שמירת הנהלים המיובאים");
                        })
                    }).catch((error) => {
                        console.error("Error importing procedures from XLSX:", error);
                        toast.error("אירעה שגיאה בעת עיבוד קובץ ה-XLSX");
                    })
                }
            };
            input.click();
        } catch (error) {
            console.error("Error importing procedures:", error);
            toast.error("אירעה שגיאה בעת ייבוא הנהלים");
        }
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
                action: "/admin/beta/procedures",
                label: "ניהול נהלים )בטא(",
                icon: RiTimelineView
            },
            {
                action: "/admin/category",
                label: "ניהול קטגוריות",
                icon: RiMenu4Line
            },
            {
                action: importProcedures,
                label: "ייבוא נהלים",
                icon: RiFolderUploadLine
            },
            {
                action: "/admin/broadcast",
                label: "שידור הודעה",
                icon: RiSendInsLine
            }
        );
    }

    return <RoleGuard allowedRoles={[UserRole.Admin, UserRole.SuperAdmin]}>
        <Header headerText={Headers.ADMIN} buttons={[]}/>

        <Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
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
