import {User} from "@/model/User";
import {remultNext} from "remult/remult-next";
import {Procedure} from "@/model/Procedure";
import {Log} from "@/model/Log";
import {getToken, JWT} from "next-auth/jwt";
import {remult, UserInfo} from "remult";
import {createPostgresDataProvider} from "remult/postgres";
import {Category} from "@/model/Category";
import {ProcedureCategory} from "@/model/ProcedureCategory";
import {KnowledgeBaseController} from "@/controllers/hierarchyController";
import {DataProviderLiveQueryStorage, SseSubscriptionServer} from "remult/server";
import {NextApiRequest} from "next";
import {UserRole} from "@/model/SuperAdmin";
import {FilesController} from "@/controllers/FilesController";


const DEVELOPER_USER = {
    email: "yeudaborodyanski@gmail.com",
    name: "Yeuda Borodyanski",
    roles: UserRole.SuperAdmin,
    active: true,
}

const dataProvider = createPostgresDataProvider({
    connectionString: process.env.POSTGRES_URL,
})

async function getUser(request: NextApiRequest): Promise<UserInfo | undefined> {
    try {
        const token: JWT | null = await getToken({
            req: request,
            secret: process.env.SECRET
        });

        if (!token || !token.email) {
            return undefined; // unauthenticated request
        }

        return User.getByEmail(remult, token.email)

    } catch (error) {
        console.error("[Remult getUser] Failed to extract user:", error);
        return undefined;
    }
}

const entities = [
    User, Procedure, Log, Category, ProcedureCategory
]

const controllers = [KnowledgeBaseController, FilesController]

export const api = remultNext({
    entities,
    ensureSchema: true,
    admin: UserRole.SuperAdmin,
    controllers,
    getUser,
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
