import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {createPostgresDataProvider} from "remult/postgres";
import {JsonDataProvider, remult} from "remult";
import {JsonEntityFileStorage} from "remult/server";
import {Admin} from "@/model/Admin";

export default remultNext({
    entities: [
        Procedure, Admin
    ],
    initRequest: async (req, options) => {
        const phone = req.headers['phone'] as string
        const adminRepo = remult.repo(Admin)
        if (phone) {
            remult.user = await adminRepo.findFirst({phone}) || Admin.isSuperAdmin(phone)
            console.log("user", remult.user)
            return
        }
    },
    dataProvider:
        production() ?
            createPostgresDataProvider({
                connectionString: process.env.POSTGRES_URL + "?sslmode=require",
            }) : async () => {
                return new JsonDataProvider(new JsonEntityFileStorage("./db"))
            },
})

function production() {
    return process.env.NODE_ENV !== 'development';
}
