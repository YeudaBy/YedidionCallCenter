import {Entity, Fields} from "remult";

@Entity("user", {
    allowApiCrud: true,
    allowApiUpdate: true,
    allowApiRead: true,
    allowApiDelete: true,
    allowApiInsert: true,
})
export class User {
    @Fields.uuid()
    id!: string;

    @Fields.string()
    name!: string;

    @Fields.object()
    role = UserRoles.User;
}

export enum UserRoles {
    Developer = "Developer",
    SuperAdmin = "SuperAdmin",
    Admin = "Admin",
    ShiftManager = "ShiftManager",
    User = "User",
}
