import {Entity, Fields, IdEntity, Relations} from "remult";
import {Procedure} from "@/model/Procedure";
import {UserRole} from "@/model/User";

@Entity("logAction", {
    allowApiRead: UserRole.SuperAdmin,
    allowApiInsert: UserRole.Admin,
    allowApiUpdate: false,
    allowApiDelete: false,
})
export class LogAction extends IdEntity {
    @Fields.string()
    by!: string;

    @Fields.string()
    change!: string;

    @Fields.createdAt()
    createdAt!: Date;

    @Relations.toOne(() => Procedure)
    procedure?: Procedure;
}
