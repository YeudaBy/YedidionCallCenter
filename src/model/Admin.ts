import {Entity, Fields, IdEntity, UserInfo} from "remult";

const ZVI = process.env.ZVI

const superAdmins = [
    process.env.SUPER_ADMIN,
    ZVI
]

@Entity("admin", {
    // allowApiCrud: false,
    allowApiRead: (remult) => {
        const isZvi = (remult!.user?.phone == ZVI)
        console.log("isZvi", isZvi, remult!.user)
        return isZvi
    }
})
export class Admin extends IdEntity {

    @Fields.string()
    name!: string;

    @Fields.string()
    phone!: string;

    static isSuperAdmin(phone: string): UserInfo | undefined {
        if (superAdmins.includes(phone)) {
            return {
                phone,
                name: "Super Admin",
                id: "-1",
            }
        }
    }
}
