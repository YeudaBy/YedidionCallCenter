import GoogleProvider from "next-auth/providers/google";
import NextAuth, {AuthOptions, Session} from "next-auth";
import api from "@/pages/api/[...remult]";
import {User} from "@/model/User";
import {JWT} from "next-auth/jwt";
import {AdapterUser} from "next-auth/adapters";

export const authOptions: AuthOptions = {
    secret: process.env.SECRET,
    pages: {
        signIn: '/auth/signin',
    },
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
        session: async ({session}: { session: Session, token: JWT, user: AdapterUser }):
            Promise<Session> => {
            const email = session.user?.email;

            if (email) {
                const remult = await api.getRemult();
                const dbUser = await User.getByEmail(remult, email);

                if (dbUser) {
                    session.user = {
                        ...session.user,
                        ...dbUser
                    };
                    remult.user = dbUser;
                }
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 * 6 // 6 months
    }
}

export default NextAuth(authOptions)
