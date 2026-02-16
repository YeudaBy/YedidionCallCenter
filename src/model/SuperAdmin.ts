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
