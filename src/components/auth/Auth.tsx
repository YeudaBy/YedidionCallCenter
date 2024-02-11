import {ReactNode, useEffect, useState} from "react";
import {signIn, useSession} from "next-auth/react";
import {remult} from "remult";
import {User, UserRole} from "@/model/User";

const userRepo = remult.repo(User);

export function Auth({children}: { children: ReactNode }) {
    const session = useSession();
    const [signedUp, setSignedUp] = useState<boolean | null>(null)

    useEffect(() => {
        if (session.status === "unauthenticated") {
            signIn();
        } else if (session.status === "authenticated") {
            userRepo.findFirst({email: session.data?.user?.email as string})
                .then(user => {
                    if (!user) {
                        // @ts-ignore
                        const s = session.data?.session?.user as any
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
    }, [session.data?.user?.email, session.data?.user?.name, session.status]);

    if (signedUp) return <>{children}</>;
    if (signedUp === false) return <div>Sign up</div>;
}
