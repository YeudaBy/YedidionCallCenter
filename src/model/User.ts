import {BackendMethod, Entity, Fields, IdEntity, Remult, UserInfo} from "remult";
import {District} from "./District";


export enum UserRole {
    Admin = "admin",
    Dispatcher = "dispacher",
    SuperAdmin = "system-admin",
}

export const AdminRoles = [UserRole.Admin, UserRole.SuperAdmin]

@Entity<User>("users", {
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

    @Fields.number()
    phone: number | undefined;

    @Fields.boolean()
    active: boolean = true;

    @Fields.createdAt()
    createdAt!: Date;

    @Fields.object()
    district?: District;

    @Fields.object()
    roles: UserRole = UserRole.Dispatcher;

    @Fields.string({required: false})
    fcmToken?: string = undefined;

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

    get isSuperAdmin() {
        return this.roles === UserRole.SuperAdmin
    }

    get isRegularAdmin() {
        return this.roles === UserRole.Admin
    }

    get isDispatcher() {
        return this.roles === UserRole.Dispatcher
    }

    get isNotRegistered() {
        return this.isDispatcher && this.active && !this.district
    }

    get phoneFormatted() {
        return this.phone ? `0${this.phone}` : undefined
    }

    get isAllowed() {
        return (!!this.district || this?.isAdmin) && !this?.active
    }

    static isAdmin(remult: Remult) {
        return remult.user && AdminRoles.includes(remult.user.roles![0] as UserRole)
    }

    static isSuperAdmin(remult: Remult) {
        return remult.user && remult.user.roles?.includes(UserRole.SuperAdmin)
    }

    static isRegularAdmin(remult: Remult) {
        return remult.user && remult.user.roles?.includes(UserRole.Admin)
    }

    static async signIn(remult: Remult, email: string) {
        const user = await remult.repo(User).findFirst({email})
        if (user) return buildUserInfo(user)
    }

    @BackendMethod({allowed: true})
    static async getByPhone(remult: Remult, phone: number) {
        const user = await remult.repo(User).findFirst({phone})
        if (user) return buildUserInfo(user)
    }
}


function buildUserInfo(u: User): UserInfo {
    return {id: u.id, name: u.name, roles: [u.roles]}
}
