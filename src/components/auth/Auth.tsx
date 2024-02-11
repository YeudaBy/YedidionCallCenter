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
                        userRepo.insert({
                            email: session.data?.user?.email as string,
                            name: session.data?.user?.name as string,
                        })
                    }
                    if (!!user?.district || user?.roles?.includes(UserRole.SuperAdmin)) {
                        remult.user = user;
                        setSignedUp(true)
                    } else {
                        setSignedUp(false);
                    }
                })
        }
    }, [session.data?.user?.email, session.status]);

    if (signedUp) return <>{children}</>;
    if (signedUp === false) return <div>Sign up</div>;
}
