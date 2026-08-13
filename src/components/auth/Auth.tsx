import {ReactNode, useEffect, useState} from "react";
import {signIn, signOut, useSession} from "next-auth/react";
import {remult} from "remult";
import {User} from "@/model/User";
import {Button, Card, Flex, Text} from "@tremor/react";
import {LoadingSpinner} from "@/components/Spinner";
import Image from "next/image";
import {useRouter} from "next/router";
import {RiRestartLine} from "@remixicon/react";
import {RegistrationForm} from "@/components/auth/RegistrationForm";

export function Auth({children}: { children: ReactNode }) {
    const session = useSession();
    const router = useRouter();

    const [authState, setAuthState] = useState<'loading' | 'authorized' | 'needs-registration' | 'pending-approval'>('loading');
    const [tempUser, setTempUser] = useState<{ name: string } | null>(null);

    const isInAuthPages = router.pathname.startsWith("/auth");

    useEffect(() => {
        if (isInAuthPages) return;

        (async () => {
            if (session.status === "unauthenticated") {
                await signIn();
                return;
            }

            if (session.status === "authenticated") {
                const s = session.data.user;
                if (!s?.email) return;

                const user = await User.createFromSession(s.email, s.name || "");

                if (User.isAllowed(user)) {
                    remult.user = User.asUserInfo(user);
                    setAuthState('authorized');
                } else if (!user.district) {
                    setTempUser({name: user.name || s.name || ""});
                    setAuthState('needs-registration');
                } else {
                    setAuthState('pending-approval');
                }
            }
        })();
    }, [session, isInAuthPages]);

    if (isInAuthPages || authState === 'authorized') return <>{children}</>;

    if (authState === 'loading') return (
        <Card className={"m-auto mt-5 w-fit"}>
            <Flex flexDirection={"col"} className={"gap-3"}>
                <Text>מאמת פרטים...</Text>
                <LoadingSpinner/>
            </Flex>
        </Card>
    );

    if (authState === 'needs-registration' && session.data?.user.email) return (
        <RegistrationForm
            initialName={tempUser?.name || ""}
            email={session.data.user.email}
            onComplete={() => {
                setAuthState('pending-approval');
            }}
        />
    );

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
