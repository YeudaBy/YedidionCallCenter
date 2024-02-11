import {ReactNode, useEffect, useState} from "react";
import {signIn, useSession} from "next-auth/react";
import {remult} from "remult";
import {User, UserRole} from "@/model/User";
import {Card} from "@tremor/react";

const userRepo = remult.repo(User);

export function Auth({children}: { children: ReactNode }) {
    const session = useSession();
    const [signedUp, setSignedUp] = useState<boolean | null>(null)

    useEffect(() => {
        if (session.status === "unauthenticated") {
            signIn();
        } else if (session.status === "authenticated") {
            // @ts-ignore
            const s = session.data?.session?.user as any
            userRepo.findFirst({email: s?.email || "0"})
                .then(user => {
                    if (!user) {
                        console.log(s)
                        userRepo.insert({
                            email: s?.email || "-",
                            name: s?.name || "-|-"
                        }).then(console.log)
                    } else {
                        console.log("exists", user)
                    }
                    if (!!user?.district || user?.roles?.includes(UserRole.SuperAdmin)) {
                        remult.user = user;
                        setSignedUp(true)
                    } else {
                        setSignedUp(false);
                    }
                })
        }
    }, [session]);

    if (signedUp) return <>{children}</>;
    else return <Card className={"m-auto mt-5 w-fit"}>
        אנא פנה למנהל המערכת על מנת לקבל גישה למערכת
    </Card>;
}
