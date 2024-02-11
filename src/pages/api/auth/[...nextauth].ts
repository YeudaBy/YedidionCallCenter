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
        session: async (session: Session, user: AdapterUser) => {
            session.user = user
            console.log("session", session, user)
            return Promise.resolve(session)
        }
    }
})

export default auth

export async function getUserOnServer(): Promise<UserInfo> {
    const session = await getSession()
    const user = session?.user
    return user as UserInfo
}
