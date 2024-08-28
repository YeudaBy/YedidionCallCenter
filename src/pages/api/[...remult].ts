import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {User} from "@/model/User";
import {createPostgresDataProvider} from "remult/postgres";
import {JsonDataProvider, remult} from "remult";
import {JsonEntityFileStorage} from "remult/server";
import {getToken} from "next-auth/jwt";

export const api = remultNext({
    entities: [
        User, Procedure,
    ],
    getUser: async (req) => {
        const jwtToken = await getToken({req})
        console.log({jwtToken})
        if (!jwtToken?.email) return
        const user = await User.signIn(remult, jwtToken.email)
        console.log({user})
        return user
    },
    logApiEndPoints: true,
    dataProvider:
        production() ?
            createPostgresDataProvider({
                connectionString: process.env.POSTGRES_URL + "?sslmode=require",
            }) : async () => {
                return new JsonDataProvider(new JsonEntityFileStorage("./db"))
            },
})

export default api


function production() {
    // return true
    return process.env.NODE_ENV !== 'development';
}
