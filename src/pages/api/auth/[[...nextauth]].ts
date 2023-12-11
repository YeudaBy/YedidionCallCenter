import NextAuth from "next-auth";
import {getSession} from "next-auth/react";
import Credentials from "next-auth/providers/credentials";
import {User} from "@/model/User";
import {remult} from "remult";


async function findUser(name: string | null | undefined) {
    const userRepo = remult.repo(User);
    if (!name) {
        console.log('inserting user')
        return await userRepo.insert({name: 'test'})
    }
    console.log('finding user: ', name)
    return await userRepo.findFirst({name})
}

const auth = NextAuth({
    providers: [
        Credentials({
            credentials: {
                name: {
                    placeholder: "Try Steve or Jane",
                    type: "text",
                    value: "Steve",
                    label: "Name"
                },
            },
            authorize: (credentials) => {
                console.log('credentials', credentials)
                return findUser(credentials?.name) || null
            }
        })
    ],
    callbacks: {
        session: async ({session}) => ({
            ...session,
            user: await findUser(session.user?.name)
        })
    },
    events: {
        session: async (message) => {
            console.log('session', message)
        }
    }
});

export default auth;

export async function getUserOnServer() {
    const session = await getSession()
    return findUser(session?.user?.name)
}
