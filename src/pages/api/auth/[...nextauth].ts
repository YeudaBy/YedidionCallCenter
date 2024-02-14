import {getSession} from "next-auth/react"
import GoogleProvider from "next-auth/providers/google";
import NextAuth, {Session} from "next-auth";
import {AdapterUser} from "next-auth/adapters";
import {UserInfo} from "remult";

const auth = NextAuth({
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
        session: async (session: Session) => {
            session.user = session.user as UserInfo
            return Promise.resolve(session)
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    }
})

export default auth

export async function getUserOnServer(): Promise<UserInfo> {
    const session = await getSession()
    return session?.user as UserInfo
}
