import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {User} from "@/model/User";
import {Event} from "@/model/Event";
import {getUserOnServer} from "@/pages/api/auth/[[...nextauth]]";

export default remultNext({
    entities: [
        Procedure, User, Event
    ],
    getUser: getUserOnServer,
    // dataProvider:
    //     createPostgresDataProvider({
    //         connectionString: "---", // default: process.env["DATABASE_URL"]
    //     })
})
