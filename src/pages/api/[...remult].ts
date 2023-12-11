import {remultNext} from 'remult/remult-next'
import {Procedure} from "@/model/Procedure";
import {createPostgresDataProvider} from "remult/postgres";

export default remultNext({
    entities: [
        Procedure
    ],
    dataProvider: createPostgresDataProvider({
        connectionString: process.env.POSTGRES_URL + "?sslmode=require",
    })
})
