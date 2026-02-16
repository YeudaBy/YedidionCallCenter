import {ReactNode, useEffect, useState} from "react";
import {signIn, signOut, useSession} from "next-auth/react";
import {remult} from "remult";
import {User} from "@/model/User";
import {Button, Card, Flex, Text} from "@tremor/react";
import {LoadingSpinner} from "@/components/Spinner";
import {messaging, onMessage} from "@/firebase-messages/messaging";
import Image from "next/image";
import {useRouter} from "next/router";
import {RiRestartLine} from "@remixicon/react";

export function Auth({children}: { children: ReactNode }) {
    const session = useSession();
    const router = useRouter();
    const [signedUp, setSignedUp] = useState<boolean | null>(null)

    const isInAuthPages = router.pathname.startsWith("/auth");

    useEffect(() => {
        onMessage(messaging, console.log);
    }, []);

    useEffect(() => {
        if (isInAuthPages) return;

        (async () => {
            switch (session.status) {
                case "unauthenticated":
                    await signIn();
                    return;

                case "loading":
                    setSignedUp(null);
                    return;

                case "authenticated": {
                    const s = session.data.user
                    if (!s || !s.email || !s.name) {
                        console.error("Session data is missing email or name", s);
                        await signOut();
                        await signIn();
                        return;
                    }

                    User.createFromSession(s.email, s.name).then(user => {
                        console.log("user from session", user)
                        if (User.isAllowed(user)) {
                            console.log("Activating user")
                            remult.user = User.asUserInfo(user);
                            setSignedUp(true)
                        } else {
                            console.log("User not active yet");
                            setSignedUp(false);
                        }
                    })
                }
            }
        })();

    }, [session]);

    if (signedUp || isInAuthPages) return <>{children}</>;
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
        signOut().then(() => {
            router.push('/api/auth/signin');
        })
    }

    return <Card className={"mx-auto my-12 w-fit flex flex-col items-center bg-tremor-brand-faint"}>
        <Image src={"/transperent-192x192.png"} alt={"Yedidim Logo"} width={180} height={180}/>
        <Text className={"mt-4 text-2xl text-center"}>
            ברוכים הבאים למוקדון
        </Text>
        <Text className={"mt-2 text-lg text-center"}>
            נהלים והנחיות למוקדני ידידים
        </Text>

        <Text className={"mt-6 text-base text-center font-bold"}>
            נרשמת בהצלחה למערכת!<br/>
            יש לפנות למנהל המוקד לאישור הפרטים והפעלת החשבון.
        </Text>

        <Button icon={RiRestartLine}
                className={"mt-6 gap-2"} onClick={goToLoginPage} variant={"light"}>
            התחבר מחדש
        </Button>
    </Card>;
}
