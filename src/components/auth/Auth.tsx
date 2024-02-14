import {ReactNode, useEffect, useState} from "react";
import {signIn, useSession} from "next-auth/react";
import {remult} from "remult";
import {User, UserRole} from "@/model/User";
import {Card, Flex, Text} from "@tremor/react";
import {LoadingSpinner} from "@/components/Spinner";

const userRepo = remult.repo(User);

export function Auth({children}: { children: ReactNode }) {
    const session = useSession();
    const [signedUp, setSignedUp] = useState<boolean | null>(null)

    useEffect(() => {
        console.log(session.status)
        if (session.status === "unauthenticated") {
            signIn();
        } else if (session.status === "loading") {
            setSignedUp(null)
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
                    if ((!!user?.district || user?.isAdmin) && user?.active !== false) {
                        remult.user = user.userInfo;
                        setSignedUp(true)
                    } else {
                        setSignedUp(false);
                    }
                })
        }
    }, [session]);

    if (signedUp) return <>{children}</>;
    if (signedUp === null) return <Card className={"m-auto mt-5 w-fit"}>
        <Flex flexDirection={"col"} className={"gap-3"}>
            <Text>מאמת פרטים</Text>
            <LoadingSpinner/>
        </Flex>
    </Card>;
    else return <Card className={"m-auto mt-5 w-fit"}>
        אנא פנה למנהל המערכת על מנת לקבל גישה למערכת
    </Card>;
}
