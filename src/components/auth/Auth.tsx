import {ReactNode, useEffect, useState} from "react";
import {signIn, useSession} from "next-auth/react";
import {remult} from "remult";
import {User} from "@/model/User";
import {Button, Card, Flex, Text} from "@tremor/react";
import {LoadingSpinner} from "@/components/Spinner";
import {messaging, onMessage} from "@/firebase-messages/messaging";
import Image from "next/image";
import { useRouter } from "next/router";
import {RiRestartLine} from "@remixicon/react";

const userRepo = remult.repo(User);

export function Auth({children}: { children: ReactNode }) {
    const session = useSession();
    const [signedUp, setSignedUp] = useState<boolean | null>(null)

    useEffect(() => {
        onMessage(messaging, console.log);
    }, []);

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
    return <NotAuthorized/>;
}

function NotAuthorized() {
    const router = useRouter();

    const goToLoginPage = () => {
        router.push('/api/auth/signin');
    }

    return <Card className={"m-12 w-fit flex flex-col items-center bg-tremor-brand-faint"}>
        <Image src={"/transperent-192x192.png"} alt={"Yedidim Logo"} width={180} height={180}/>
        <Text className={"mt-4 text-2xl text-center"}>
            ברוכים הבאים למוקדון
        </Text>
        <Text className={"mt-2 text-lg text-center"}>
            נהלים והנחיות למוקדני ידידים
        </Text>

        <Text className={"mt-6 text-base text-center font-bold"}>
            לצערנו אינך מוגדר כרגע במערכת, נא פנה למנהל המוקד על מנת להגדיר אותך.
        </Text>

        <Button icon={RiRestartLine}
            className={"mt-6 gap-2"} onClick={goToLoginPage} variant={"light"}>
            נסיון התחברות מחדש
        </Button>
    </Card>;
}
