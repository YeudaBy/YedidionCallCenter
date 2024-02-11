import {Entity, Fields, IdEntity, UserInfo} from "remult";
import {District} from "./District";

@Entity("users", {
    allowApiCrud: true,
})
export class User extends IdEntity {

    @Fields.string()
    name!: string;

    @Fields.string()
    email!: string;

    @Fields.boolean()
    active: boolean = true;

    @Fields.createdAt()
    createdAt!: Date;

    @Fields.object()
    district!: District;

    @Fields.json()
    roles: UserRole[] = [UserRole.Dispatcher];

    get userInfo(): UserInfo {
        return {
            name: this.email,
            id: this.id,
            roles: this.roles,
        }
    }
}


export enum UserRole {
    Admin = "מנהל",
    Dispatcher = "מוקדן",
    SuperAdmin = "מנהל מערכת",
}
