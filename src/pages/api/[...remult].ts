import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {User, UserRole} from "@/model/User";
import {createPostgresDataProvider} from "remult/postgres";
import {remult} from "remult";
import {getToken} from "next-auth/jwt";
import {ApiController} from "@/controllers/ApiController";
import {Log} from "@/model/Log";


const DEVELOPER_USER = {
    email: "yeudaborodyanski@gmail.com",
    name: "Yeuda Borodyanski",
    roles: UserRole.SuperAdmin,
    active: true,
}


export const api = remultNext({
    entities: [
        User, Procedure, Log
    ],
    ensureSchema: true,
    admin: true,
    controllers: [ApiController],
    getUser: async (req) => {
        const jwtToken = await getToken({req})
        if (!jwtToken?.sub) return undefined
        return User.signIn(remult, jwtToken.sub)
    },
    initApi: async (api) => {
        await api.repo(User).insert(DEVELOPER_USER)
    },
    logApiEndPoints: false,
    dataProvider: createPostgresDataProvider({
        connectionString: process.env.POSTGRES_URL,
    })
})

export default api
