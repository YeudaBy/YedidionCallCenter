import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {User} from "@/model/User";
import {getUserOnServer} from "./auth/[...nextauth]";

export const api = remultNext({
    entities: [
        User, Procedure,
    ],
    // controllers: [
    //     UsersController
    // ],
    getUser: getUserOnServer,
    logApiEndPoints: true
})

export default api
