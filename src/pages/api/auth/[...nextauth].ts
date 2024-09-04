import GoogleProvider from "next-auth/providers/google";
import NextAuth, {AuthOptions, getServerSession, Session} from "next-auth";
import api from "@/pages/api/[...remult]";
import {User} from "@/model/User";
import {GetServerSidePropsContext, NextApiRequest, NextApiResponse} from "next";

const authOptions: AuthOptions = {
    secret: process.env.SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    access_type: "offline",
                    prompt: "consent",
                    response_type: "code"
                }
            }
        })
    ],

    callbacks: {
        // @ts-ignore
        session: async (session: Session, token) => {
            console.log({session, token})
            const remult = await api.getRemult({} as any)
            // @ts-ignore
            const email = session.session.user?.email
            if (session.user) {
                return session
            }
            if (email) {
                const user = await User.signIn(remult, email)
                console.log({user})
                if (user) {
                    session.user = user
                    remult.user = user
                }
            }
            return {
                ...session,
                user: await User.signIn(remult, email)
            }
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    }
}

export default NextAuth(authOptions)


export function auth(
    ...args:
        | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
        | [NextApiRequest, NextApiResponse]
        | []
) {
    return getServerSession(...args, authOptions)
}

export async function getUserOnServer() {
    const session = await getServerSession()
    return User.signIn(await api.getRemult({} as any), session?.user?.email || "")
}
