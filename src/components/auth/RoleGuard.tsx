import React from "react";
import {remult} from "remult";
import {Button, Callout, Card, Text} from "@tremor/react";
import {RiFingerprintLine} from "@remixicon/react";
import { useRouter } from "next/router";
import {UserRole} from "@/model/SuperAdmin";


export function RoleGuard({ children, allowedRoles }: {
    children: React.ReactNode;
    allowedRoles: UserRole[]
}) {
    const router = useRouter();

    const goHome = () => {
        router.push("/");
    }

    if (!remult.user || !remult.user.roles || remult.user.roles.length === 0) {
        return <div>You must be logged in to view this page.</div>;
    }

    const userRole: string[] = remult.user.roles;
    const isAllowed = allowedRoles.some(role => userRole.includes(role));

    if (!isAllowed) {
        return <Card className={"max-w-md mx-auto mt-10 text-center"}>
            <Callout title={"אין גישה!"} color={"red"} icon={RiFingerprintLine}/>
            <Text className={"mt-2"}>
                אין לך הרשאות לצפות בתוכן זה. אנא פנה למנהל המערכת אם אתה חושב שזה טעות.
            </Text>

            <Button className={"mt-8"} variant={"light"} onClick={goHome}>
                חזור לדף הבית
            </Button>
        </Card>;
    }

    return <>{children}</>;
}
