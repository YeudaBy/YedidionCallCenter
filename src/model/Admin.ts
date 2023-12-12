import {Allow, Entity, Fields, IdEntity} from "remult";

@Entity("admin", {
    allowApiCrud: false,
    allowApiRead: Allow.authenticated,
})
export class Admin extends IdEntity {

    @Fields.string()
    name!: string;

    @Fields.string()
    phone!: string;
}
