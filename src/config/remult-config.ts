import {User, UserRole} from "@/model/User";
import {remultNext} from "remult/remult-next";
import {Procedure} from "@/model/Procedure";
import {Log} from "@/model/Log";
import {ApiController} from "@/controllers/ApiController";
import {getToken} from "next-auth/jwt";
import {remult, SubscriptionServer} from "remult";
import {createPostgresDataProvider} from "remult/postgres";
import {Category} from "@/model/Category";
import {ProcedureCategory} from "@/model/ProcedureCategory";
import {KnowledgeBaseController} from "@/controllers/hierarchyController";
import {DataProviderLiveQueryStorage, SseSubscriptionServer} from "remult/server";


const DEVELOPER_USER = {
    email: "yeudaborodyanski@gmail.com",
    name: "Yeuda Borodyanski",
    roles: UserRole.SuperAdmin,
    active: true,
}


const dataProvider = createPostgresDataProvider({
    connectionString: process.env.POSTGRES_URL,
})


export const api = remultNext({
    entities: [
        User, Procedure, Log, Category, ProcedureCategory
    ],
    ensureSchema: true,
    admin: true,
    controllers: [ApiController, KnowledgeBaseController],
    getUser: async (req) => {
        const jwtToken = await getToken({req})
        // console.log("jwtToken", jwtToken)
        if (!jwtToken?.sub) return undefined
        return User.signIn(remult, jwtToken.sub)
    },
    initApi: async (api) => {
        if (await api.repo(User).count() === 0) {
            await api.repo(User).insert(DEVELOPER_USER)
        }
    },
    logApiEndPoints: false,
    dataProvider: dataProvider,
    subscriptionServer: new SseSubscriptionServer(),
    liveQueryStorage: new DataProviderLiveQueryStorage(dataProvider)
})
