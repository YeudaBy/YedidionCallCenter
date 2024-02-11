import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {User} from "@/model/User";
import {getUserOnServer} from "./auth/[...nextauth]";
import {createPostgresDataProvider} from "remult/postgres";
import {JsonDataProvider} from "remult";
import {JsonEntityFileStorage} from "remult/server";

export const api = remultNext({
    entities: [
        User, Procedure,
    ],
    // controllers: [
    //     UsersController
    // ],
    getUser: getUserOnServer,
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
    return process.env.NODE_ENV !== 'development';
}
