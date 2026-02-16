import "remult";
import {District} from "@/model/District";
import {User} from "next-auth";

declare module "remult" {
    export interface RemultContext {
        district?: District | undefined
    }

    export type UserInfo = User
}
