import {Entity, Fields, IdEntity} from "remult";
import {UserRole} from "@/model/User";

export enum LogType {
    Created = "נוצר",
    Updated = "עודכן",
    Deleted = "נמחק",
    Imported = "יובא",
    Other = "אחר"
}

@Entity("log", {
    allowApiRead: UserRole.SuperAdmin,
    allowApiCrud: true
})
export class Log extends IdEntity {
    @Fields.createdAt()
    createdAt!: Date;

    @Fields.string()
    byUserId!: string;

    @Fields.string({required: false})
    procedureId!: string;

    @Fields.string({required: false})
    userId!: string;

    @Fields.string()
    log!: string;

    @Fields.enum(() => LogType)
    type: LogType = LogType.Other;
}
