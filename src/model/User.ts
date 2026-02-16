import {BackendMethod, Entity, Fields, IdEntity, Remult, repo, UserInfo} from "remult";
import {District} from "./District";


export enum UserRole {
    Admin = "admin",
    Dispatcher = "dispacher",
    SuperAdmin = "system-admin",
}

export function userRoleToText(role: UserRole) {
    switch (role) {
        case UserRole.Admin:
            return "מנהל";
        case UserRole.Dispatcher:
            return "מוקדן";
        case UserRole.SuperAdmin:
            return "מנהל מערכת";
    }
}

export const AdminRoles = [UserRole.Admin, UserRole.SuperAdmin]

const userAllowed = (remult?: Remult) => {
    if (!remult || !remult.user) return false
    return User.isSomeAdmin(remult)
}

@Entity<User>("users", {
    allowApiCrud: userAllowed,
    allowApiRead: true,
    allowApiInsert: true,
})
export class User extends IdEntity {

    @Fields.string({allowApiUpdate: AdminRoles})
    name!: string;

    @Fields.string({allowApiUpdate: AdminRoles})
    email!: string;

    @Fields.number({
        allowApiUpdate: (entity?: User, c?: Remult) => {
            if (!c || !c?.user) return false
            if (User.isSomeAdmin(c)) return true
            // allow user to update their own phone number
            return entity?.id === c.user.id
        },
    })
    phone: number | undefined;

    @Fields.string({
        sqlExpression: "LPAD(phone::text, 10, '0')",
        allowApiUpdate: false,
    })
    phoneString: string | undefined;

    @Fields.boolean({allowApiUpdate: AdminRoles})
    active: boolean = true;

    @Fields.createdAt({allowApiUpdate: false})
    createdAt!: Date;

    @Fields.object({allowApiUpdate: AdminRoles})
    district?: District;

    @Fields.object({allowApiUpdate: UserRole.SuperAdmin})
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

    static isAllowed(obj: User | undefined) {
        return (!!obj?.district || obj?.roles == UserRole.SuperAdmin) && obj.active
    }

    static isSomeAdmin(remult: Remult) {
        return this.isSuperAdmin(remult) || this.isRegularAdmin(remult)
    }

    static isSuperAdmin(remult: Remult) {
        if (!remult.user) return false
        if (Array.isArray(remult.user.roles)) {
            return remult.user.roles.includes(UserRole.SuperAdmin)
        }
        return remult.user.roles === UserRole.SuperAdmin
    }

    static isRegularAdmin(remult: Remult) {
        if (!remult.user) return false
        if (Array.isArray(remult.user.roles)) {
            return remult.user.roles.includes(UserRole.Admin)
        }
        return remult.user.roles === UserRole.Admin
    }

    @BackendMethod({allowed: true})
    static async getByEmail(remult: Remult, email: string) {
        const user = await remult.repo(User).findFirst({email})
        if (user) return buildUserInfo(user)
    }

    static async hasFcmToken(remult: Remult) {
        if (!remult.user) return false
        const user = await remult.repo(User).findId(remult.user.id)
        return !!user?.fcmToken
    }

    @BackendMethod({allowed: true})
    static async getByPhone(remult: Remult, phone: number) {
        const user = await remult.repo(User).findFirst({phone})
        if (user) return buildUserInfo(user)
    }

    @BackendMethod({allowed: true})
    static async createFromSession(email: string, name: string): Promise<User> {
        let user = await repo(User).findFirst({email})
        if (!user) {
            user = await repo(User).insert({email, name})
        }
        return user
    }
}


function buildUserInfo(u: User): UserInfo {
    return {id: u.id, name: u.name, roles: [u.roles]}
}
