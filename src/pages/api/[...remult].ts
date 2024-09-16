import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {User} from "@/model/User";
import {createPostgresDataProvider} from "remult/postgres";
import {JsonDataProvider, remult} from "remult";
import {JsonEntityFileStorage} from "remult/server";
import {getToken} from "next-auth/jwt";
import {ApiController} from "@/controllers/ApiController";
import {Log} from "@/model/Log";

export const api = remultNext({
    entities: [
        User, Procedure, Log
    ],
    ensureSchema: true,
    controllers: [ApiController],
    getUser: async (req) => {
        const jwtToken = await getToken({req})
        if (!jwtToken?.sub) return undefined
        return User.signIn(remult, jwtToken.sub)
    },
    logApiEndPoints: true,
    dataProvider:
        production() ?
            createPostgresDataProvider({
                connectionString: process.env.POSTGRES_URL,
            }) : async () => {
                return new JsonDataProvider(new JsonEntityFileStorage("./db"))
            },
})

export default api


function production() {
    return true
    return process.env.NODE_ENV !== 'development';
}
