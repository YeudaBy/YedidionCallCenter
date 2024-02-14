import {Entity, Fields, IdEntity, remult, UserInfo} from "remult";
import {District} from "./District";


export enum UserRole {
    Admin = "מנהל",
    Dispatcher = "מוקדן",
    SuperAdmin = "מנהל מערכת",
}

export const AdminRoles = [UserRole.Admin, UserRole.SuperAdmin]

@Entity("users", {
    allowApiCrud: true,
    // allowApiRead: true,
    // allowApiUpdate: true,
    // allowApiDelete: () => !!remult.user?.roles?.length && AdminRoles.includes(remult.user.roles[0] as UserRole),
    // allowApiInsert: () => !!remult.user?.roles?.length && AdminRoles.includes(remult.user.roles[0] as UserRole),
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
    district?: District;

    @Fields.object()
    roles: UserRole = UserRole.Dispatcher;

    get userInfo(): UserInfo {
        return {
            name: this.email,
            id: this.id,
            roles: [this.roles],
        }
    }

    get isAdmin() {
        return AdminRoles.includes(this.roles)
    }
}
